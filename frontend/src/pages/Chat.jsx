import { useState, useRef, useEffect } from "react";
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
// runs of "joined" notices merged into one line, and regular messages
const buildTimeline = (messages) => {
  const items = [];
  let lastDay = null;

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

    if (msg?.messageType === "join") {
      const name = msg?.message?.replace(JOIN_SUFFIX, "") || "Someone";
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
    syncUnread,
    handleRoomTypeChange,
    handleChatRoomIdChange,
  } = useAuth();
  const userName = userData?.user?.name;
  const [currentUser] = useState(userData?.user?.userId);
  const [messages, setMessages] = useState([]);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);
  const messagesEndRef = useRef(null);
  const scrollerRef = useRef(null);
  const isAtBottomRef = useRef(true);

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

  // Keep the newest messages in view when the message area shrinks,
  // e.g. while the input grows or the mobile keyboard opens
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const observer = new ResizeObserver(() => {
      if (isAtBottomRef.current) {
        scroller.scrollTop = scroller.scrollHeight;
      }
    });
    observer.observe(scroller);
    return () => observer.disconnect();
  }, []);

  const handleMessage = (message) => {
    // The socket stays in rooms opened earlier, so ignore other rooms' messages here
    if (message?.success && String(message.data?.roomId) === String(chatRoomId)) {
      setMessages((prevMessages) => [...prevMessages, message.data]);
      // Seen as it arrives, so it shouldn't count as unread next time
      if (String(message.data?.senderId) !== String(userData?.user?.userId)) {
        markRead(chatRoomId);
      }
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

  // Load the open chat's history: once when the page opens and again on every
  // chat switch (an effect also runs on first render, so one effect covers both)
  useEffect(() => {
    setMessages([]);
    if (!chatRoomId) return;

    // Switching chats before this reply arrives makes it stale: drop it, or a
    // slow reply for the old chat would replace the new chat's messages
    let cancelled = false;

    GET("messages/getMessages", { roomId: chatRoomId }, {}, {})
      .then((response) => {
        if (cancelled || !response?.success) return;
        const history = response.data || [];
        const inHistory = new Set(history.map((msg) => msg._id));
        // Keep live messages that arrived while loading and aren't in the history yet
        setMessages((live) => [...history, ...live.filter((msg) => !inHistory.has(msg._id))]);
      })
      .catch((error) => {
        if (!cancelled) console.error("Couldn't load messages:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [chatRoomId]);

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [messages]);

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
        <div
          ref={scrollerRef}
          className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-6"
          onScroll={(e) => {
            const { scrollTop, scrollHeight, clientHeight } = e.target;
            const atBottom = scrollHeight - scrollTop <= clientHeight + 50;
            isAtBottomRef.current = atBottom;
            setIsAtBottom(atBottom);
          }}
        >
          <div className="w-full lg:max-w-4xl mx-auto">
            {messages.length === 0 ? (
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
              buildTimeline(messages).map((item) => {
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
            <div ref={messagesEndRef} />
          </div>
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
