import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { ArrowDown, Loader2 } from "lucide-react";
import socket from "../Socket.jsx";
import ChatHeader from "./ChatHeader";
import MessageItem from "./MessageItem";
import MessageInput from "./MessageInput";
import { useAuth } from "../contexts/AuthContext.js";
import CustomeApiService from "../services/CustomApiService.jsx";
import MessageTypingIndicator from "./MessageTypingIndicator.jsx";
import OnlineUsers from "./OnlineUsers.jsx";
import { expireSession } from "../utils/session.js";
import { toast } from "sonner";

const JOIN_SUFFIX = / has joined the chat$/i;

// Messages per page: the newest ones load first, older ones as you scroll up
const PAGE_SIZE = 50;
// How close (px) to the bottom still counts as "reading the newest messages"
const BOTTOM_SLACK = 60;

const formatDayLabel = (date) => {
  const day = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (day.toDateString() === today.toDateString()) return "Today";
  if (day.toDateString() === yesterday.toDateString()) return "Yesterday";
  const daysAgo = (today - day) / 86400000;
  if (daysAgo < 7) return day.toLocaleDateString("en-IN", { weekday: "long" });
  return day.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const formatJoinLabel = (names) => {
  if (names.length === 1) return `${names[0]} joined the chat`;
  if (names.length === 2) return `${names[0]} and ${names[1]} joined the chat`;
  if (names.length === 3) return `${names[0]}, ${names[1]} and ${names[2]} joined the chat`;
  return `${names[0]}, ${names[1]} and ${names.length - 2} others joined the chat`;
};

// Turn the flat message list into what we render: date separators,
// runs of "joined" notices merged into one line, the "Unread messages" divider,
// and regular messages
const buildTimeline = (messages, firstUnreadId) => {
  const items = [];
  let lastDay = null;
  // Older versions saved a "joined" notice every time someone came online;
  // show each person's earliest one only
  const joinedNames = new Set();

  // Chronological order, so date separators never repeat
  const ordered = [...messages].sort(
    (a, b) => new Date(a?.createdAt || 0) - new Date(b?.createdAt || 0),
  );

  ordered.forEach((msg, index) => {
    const day = msg?.createdAt ? new Date(msg.createdAt).toDateString() : lastDay;
    if (day && day !== lastDay) {
      items.push({ type: "date", key: `date-${day}`, label: formatDayLabel(msg.createdAt) });
      lastDay = day;
    }

    const prevItem = items[items.length - 1];

    if (msg?._id && msg._id === firstUnreadId) {
      items.push({ type: "unread", key: "unread-divider" });
    }

    if (msg?.messageType === "join") {
      const name = msg?.message?.replace(JOIN_SUFFIX, "") || "Someone";
      if (joinedNames.has(name)) return;
      joinedNames.add(name);
      if (prevItem?.type === "join") {
        if (!prevItem.names.includes(name)) prevItem.names.push(name);
        return;
      }
      items.push({ type: "join", key: `join-${msg?._id || index}`, names: [name] });
      return;
    }

    items.push({
      type: "message",
      key: msg?._id || index,
      msg,
      prevMessage: prevItem?.type === "message" ? prevItem.msg : null,
    });
  });

  return items;
};

const Chat = () => {
  const { GET } = CustomeApiService();
  const {
    userData,
    chatRoomId,
    roomType,
    addUnread,
    clearUnread,
    markRead,
    unreadCounts,
    syncUnread,
    handleRoomTypeChange,
    handleChatRoomIdChange,
  } = useAuth();
  const userName = userData?.user?.name;
  const [currentUser] = useState(userData?.user?.userId);
  const [messages, setMessages] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  // New messages that arrived while you were reading older ones
  const [newCount, setNewCount] = useState(0);
  const [farFromBottom, setFarFromBottom] = useState(false);
  // First message you hadn't read when you opened the chat
  const [firstUnreadId, setFirstUnreadId] = useState(null);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);
  const scrollerRef = useRef(null);
  const contentRef = useRef(null);
  // true while the view is at the newest message, so it follows new ones
  const isAtBottomRef = useRef(true);
  // What to do with the scroll position after the next render:
  // "open" a chat, "bottom" for a new message, "prepend" older messages
  const pendingScrollRef = useRef(null);
  const loadingOlderRef = useRef(false);
  // While a smooth scroll to the newest message is animating, the view is briefly
  // "not at the bottom"; this keeps that from counting as reading older messages
  const autoScrollUntilRef = useRef(0);

  // Pin the chat to the part of the screen that's actually visible.
  // iOS Safari (and some Android browsers) don't shrink the page when the
  // keyboard opens - they slide it up, which pushed the header off-screen.
  // visualViewport reports the visible area, so we size and offset to it.
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const root = document.documentElement;

    const update = () => {
      root.style.setProperty("--app-height", `${viewport.height}px`);
      root.style.setProperty("--app-offset", `${viewport.offsetTop}px`);
    };

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      root.style.removeProperty("--app-height");
      root.style.removeProperty("--app-offset");
    };
  }, []);

  // Keep the newest messages in view when the visible area shrinks (the input
  // grows, the mobile keyboard opens) or the content grows (photos finish loading)
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !contentRef.current) return;
    const observer = new ResizeObserver(() => {
      if (isAtBottomRef.current && !pendingScrollRef.current) {
        scroller.scrollTop = scroller.scrollHeight;
      }
    });
    observer.observe(scroller);
    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, []);

  const handleMessage = (message) => {
    // The socket stays in rooms opened earlier, so ignore other rooms' messages here
    if (message?.success && String(message.data?.roomId) === String(chatRoomId)) {
      const mine = String(message.data?.senderId) === String(userData?.user?.userId);
      setMessages((prevMessages) =>
        prevMessages.some((m) => m._id === message.data._id) ? prevMessages : [...prevMessages, message.data],
      );
      if (mine || isAtBottomRef.current) {
        // Your own message, or you're following along: show it
        pendingScrollRef.current = { type: "bottom" };
      } else {
        // You're reading older messages: don't yank the view, offer a button instead
        setNewCount((count) => count + 1);
      }
      // Seen as it arrives, so it shouldn't count as unread next time
      if (!mine) markRead(chatRoomId);
    }
  };

  // Count messages that arrive for chats other than the open one
  const chatRoomIdRef = useRef(chatRoomId);
  chatRoomIdRef.current = chatRoomId;

  useEffect(() => {
    const myId = userData?.user?.userId;
    const handleNotification = (notification) => {
      if (notification?.senderId === myId) return;
      if (notification?.roomId === chatRoomIdRef.current) return;
      addUnread(notification.roomId);
    };
    socket.on("message-notification", handleNotification);
    // After a reconnect (phone woke up, network blip) catch up on missed messages
    socket.on("connect", syncUnread);
    return () => {
      socket.off("message-notification", handleNotification);
      socket.off("connect", syncUnread);
    };
  }, []);

  // Opening a chat marks it as read
  useEffect(() => {
    if (chatRoomId) clearUnread(chatRoomId);
  }, [chatRoomId]);

  // Load the open chat's newest messages: once when the page opens and again on
  // every chat switch (an effect also runs on first render, so one effect covers both)
  useEffect(() => {
    // Unread count from just before opening (the effect above clears it for next time)
    const unreadAtOpen = unreadCounts?.[chatRoomId] || 0;

    setMessages([]);
    setHasMore(false);
    setNewCount(0);
    setFarFromBottom(false);
    setFirstUnreadId(null);
    isAtBottomRef.current = true;
    pendingScrollRef.current = null;
    loadingOlderRef.current = false;
    setLoadingOlder(false);
    if (!chatRoomId) return;
    setLoadingHistory(true);

    // Switching chats before this reply arrives makes it stale: drop it, or a
    // slow reply for the old chat would replace the new chat's messages
    let cancelled = false;
    // Enough to include every unread message, so the view can open at the first one
    const limit = Math.min(200, Math.max(PAGE_SIZE, unreadAtOpen + 20));

    GET("messages/getMessages", { roomId: chatRoomId, limit }, {}, {})
      .then((response) => {
        if (cancelled || !response?.success) return;
        const history = response.data || [];
        const inHistory = new Set(history.map((msg) => msg._id));
        // Keep live messages that arrived while loading and aren't in the history yet
        setMessages((live) => [...history, ...live.filter((msg) => !inHistory.has(msg._id))]);
        setHasMore(!!response.hasMore);

        if (unreadAtOpen > 0) {
          const fromOthers = history.filter(
            (msg) => msg.messageType === "user" && String(msg.senderId) !== String(currentUser),
          );
          setFirstUnreadId(fromOthers[Math.max(0, fromOthers.length - unreadAtOpen)]?._id || null);
        }
        pendingScrollRef.current = { type: "open" };
      })
      .catch((error) => {
        if (!cancelled) console.error("Couldn't load messages:", error);
      })
      .finally(() => {
        if (!cancelled) setLoadingHistory(false);
      });

    return () => {
      cancelled = true;
    };
  }, [chatRoomId]);

  // Older messages, when you scroll near the top
  const loadOlder = () => {
    if (loadingOlderRef.current || !hasMore || messages.length === 0) return;
    const roomId = chatRoomId;
    const oldest = messages.reduce((a, b) => (new Date(a.createdAt) <= new Date(b.createdAt) ? a : b));
    loadingOlderRef.current = true;
    setLoadingOlder(true);

    GET("messages/getMessages", { roomId, before: oldest._id, limit: PAGE_SIZE }, {}, {})
      .then((response) => {
        if (roomId !== chatRoomIdRef.current || !response?.success) return;
        const scroller = scrollerRef.current;
        // Remember where you were, so adding messages above doesn't move what you're reading
        pendingScrollRef.current = { type: "prepend", height: scroller.scrollHeight, top: scroller.scrollTop };
        setMessages((current) => {
          const have = new Set(current.map((msg) => msg._id));
          return [...(response.data || []).filter((msg) => !have.has(msg._id)), ...current];
        });
        setHasMore(!!response.hasMore);
      })
      .catch((error) => console.error("Couldn't load older messages:", error))
      .finally(() => {
        if (roomId !== chatRoomIdRef.current) return;
        loadingOlderRef.current = false;
        setLoadingOlder(false);
      });
  };

  // Apply the scroll position asked for above, right after the DOM updates and
  // before the browser paints, so nothing visibly jumps
  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    const pending = pendingScrollRef.current;
    if (!scroller || !pending) return;
    pendingScrollRef.current = null;

    if (pending.type === "prepend") {
      scroller.scrollTop = pending.top + (scroller.scrollHeight - pending.height);
      return;
    }
    if (pending.type === "open") {
      // Open at the first unread message if there is one, otherwise at the newest
      const divider = scroller.querySelector("[data-unread-divider]");
      if (divider) {
        const offset = divider.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
        scroller.scrollTop += offset - 12;
      } else {
        scroller.scrollTop = scroller.scrollHeight;
      }
    } else {
      autoScrollUntilRef.current = Date.now() + 700;
      scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
      setNewCount(0);
    }
    const distance = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
    isAtBottomRef.current = pending.type === "bottom" || distance <= BOTTOM_SLACK;
  }, [messages, firstUnreadId]);

  const jumpToNewest = () => {
    pendingScrollRef.current = null;
    isAtBottomRef.current = true;
    setNewCount(0);
    autoScrollUntilRef.current = Date.now() + 700;
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const distance = scrollHeight - scrollTop - clientHeight;
    if (distance <= BOTTOM_SLACK) isAtBottomRef.current = true;
    else if (Date.now() > autoScrollUntilRef.current) isAtBottomRef.current = false;
    if (isAtBottomRef.current && newCount) setNewCount(0);
    const far = distance > 400;
    if (far !== farFromBottom) setFarFromBottom(far);
    if (scrollTop < 200) loadOlder();
  };

  useEffect(() => {
    if (!currentUser || !chatRoomId) return;

    const joinRoom = () => {
      socket.emit("join-room", {
        roomId: chatRoomId,
        userName,
        roomType,
      });
    };

    // If socket is already connected
    if (socket.connected) {
      joinRoom();
    }

    // If socket reconnects later
    socket.on("connect", joinRoom);

    socket.on("message", handleMessage);

    const handleConnectError = (error) => {
      console.error("Socket connection error:", error.message);
      // The server rejects the socket when the login token is missing or expired
      if (/unauthorized|expired/i.test(error.message)) {
        expireSession();
      }
    };

    socket.on("connect_error", handleConnectError);

    // The server refused to open this chat (not a participant): back to the public room
    const handleRoomError = ({ message } = {}) => {
      toast.error(message || "You don't have access to this chat");
      handleRoomTypeChange("public");
      handleChatRoomIdChange(userData?.user?.publicRoomId);
    };
    socket.on("room-error", handleRoomError);

    return () => {
      socket.off("connect", joinRoom);
      socket.off("message", handleMessage);
      socket.off("connect_error", handleConnectError);
      socket.off("room-error", handleRoomError);
    };
  }, [currentUser, chatRoomId]);

  const handleShowOnlineUsers = () => {
    setShowOnlineUsers((prev) => !prev);
  };

  const closeOnlineUsers = () => {
    setShowOnlineUsers(false);
  };

  return (
    // Fixed to the visible viewport (see the visualViewport effect above), so the
    // header stays on screen and the input sits right above the mobile keyboard.
    // overflow-clip, not overflow-hidden: on phones the People panel waits just
    // off-screen, and a hidden-overflow box can still be scrolled by focus (Tab,
    // screen readers), which slid the whole chat sideways. Clip can't scroll at all.
    <div
      className="fixed top-0 left-0 flex w-screen overflow-clip app-bg text-gray-900"
      style={{
        height: "var(--app-height, 100dvh)",
        transform: "translateY(var(--app-offset, 0px))",
      }}
    >
      {/* Main Chat Area */}
      <div
        className={`flex-1 min-w-0 flex flex-col ${!currentUser ? "opacity-50 pointer-events-none" : ""}`}
      >
        <ChatHeader />

        {/* Messages - scrolling container */}
        <div className="relative flex-1 min-h-0">
        <div
          ref={scrollerRef}
          className="h-full overflow-y-auto overscroll-contain px-3 py-4 sm:px-6"
          onScroll={handleScroll}
        >
          <div ref={contentRef} className="w-full lg:max-w-4xl mx-auto">
            {/* Top of the history: fixed height, so swapping its contents never shifts the messages */}
            {messages.length > 0 && (
              <div className="h-8 flex items-center justify-center text-[11px] text-gray-500">
                {loadingOlder ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-500" />
                    Loading earlier messages...
                  </span>
                ) : !hasMore ? (
                  "This is the beginning of the chat"
                ) : null}
              </div>
            )}
            {loadingHistory && messages.length === 0 ? (
              <div className="flex justify-center pt-24">
                <Loader2 className="w-7 h-7 animate-spin text-violet-500" />
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex items-center justify-center pt-16">
                <div className="text-center text-gray-500">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 text-violet-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <p className="text-lg font-semibold text-gray-800">No messages yet</p>
                  <p className="text-sm">
                    Start a conversation by sending a message!
                  </p>
                </div>
              </div>
            ) : (
              buildTimeline(messages, firstUnreadId).map((item) => {
                if (item.type === "unread") {
                  return (
                    <div key={item.key} data-unread-divider className="flex items-center gap-3 my-3">
                      <span className="flex-1 h-px bg-rose-300/70" />
                      <span className="text-[11px] font-semibold text-rose-500 uppercase tracking-wider">
                        Unread messages
                      </span>
                      <span className="flex-1 h-px bg-rose-300/70" />
                    </div>
                  );
                }
                if (item.type === "date") {
                  return (
                    <div key={item.key} className="flex justify-center pt-4 pb-1">
                      <span className="text-[11px] font-medium text-gray-600 glass-bubble rounded-full px-3 py-1">
                        {item.label}
                      </span>
                    </div>
                  );
                }
                if (item.type === "join") {
                  return (
                    <div key={item.key} className="flex justify-center my-2">
                      <span className="max-w-[90%] truncate text-[11px] text-gray-600 bg-white/50 backdrop-blur rounded-full px-3 py-1">
                        {formatJoinLabel(item.names)}
                      </span>
                    </div>
                  );
                }
                return (
                  <MessageItem
                    key={item.key}
                    msg={item.msg}
                    currentUser={currentUser}
                    prevMessage={item.prevMessage}
                  />
                );
              })
            )}
            <MessageTypingIndicator key={chatRoomId} roomId={chatRoomId} />
          </div>
        </div>

        {/* Back to the newest messages, while reading older ones */}
        {(newCount > 0 || farFromBottom) && (
          <button
            onClick={jumpToNewest}
            title="Jump to the newest messages"
            className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 rounded-full shadow-lg transition-colors ${
              newCount > 0
                ? "btn-primary px-4 py-2 text-sm font-semibold"
                : "w-10 h-10 justify-center bg-white/90 text-violet-600 hover:bg-white border border-white"
            }`}
          >
            <ArrowDown className="w-4 h-4" />
            {newCount > 0 && `${newCount} new message${newCount > 1 ? "s" : ""}`}
          </button>
        )}
        </div>

        {/* Input Area */}
        <MessageInput
          disabled={!currentUser}
          handleShowOnlineUsers={handleShowOnlineUsers}
        />
      </div>
      <OnlineUsers
        showOnlineUsers={showOnlineUsers}
        handleShowOnlineUsers={handleShowOnlineUsers}
        closeOnlineUsers={closeOnlineUsers}
      />
    </div>
  );
};

export default Chat;
