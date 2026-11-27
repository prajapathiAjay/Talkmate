import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  SESSION_EXPIRED_EVENT,
  getTokenExpiry,
  getToken,
  appStorage,
  clearSession,
} from "../utils/session.js";
import socket from "../Socket.jsx";
import CustomApiService from "../services/CustomApiService.jsx";
import { AuthContext } from "./AuthContext.js";

const AuthProvider = ({ children }) => {
  const { GET, POST } = CustomApiService();
  // App data is kept beside the login token: in localStorage ("remember me") or
  // sessionStorage (this browser session only) - see utils/session.js
  const [userData, setUserData] = useState(() => {
    if (!getToken()) return null;
    const availableUser = appStorage().getItem("userData");
    return availableUser ? JSON.parse(availableUser) : null;
  });

  const [currentPartner, setCurrentPartner] = useState(() => {
    const availablePartner = appStorage().getItem("currentPartner");
    return availablePartner ? JSON.parse(availablePartner) : { type: "public" };
  });

  const [friendRoom, setFriendRoom] = useState(() => {
    const availableFriends = appStorage().getItem("friendRoom");
    return availableFriends ? JSON.parse(availableFriends) : [];
  });

  const [roomType, setRoomType] = useState(() => {
    const availableRoomType = appStorage().getItem("roomType");
    return availableRoomType ? availableRoomType : "public";
  });

  const [chatRoomId, setChatRoomId] = useState(() =>
    appStorage().getItem("chatRoomId")
  );

  // Unread message counts per room id, e.g. { "<roomId>": 3 }.
  // The server is the source of truth (it remembers what each user last read),
  // so counts include messages that arrived while the user was offline.
  const [unreadCounts, setUnreadCounts] = useState({});

  const chatRoomIdRef = useRef(chatRoomId);
  chatRoomIdRef.current = chatRoomId;

  // Tell the server a room has been read. Debounced per room so a burst of
  // incoming messages in the open chat becomes a single request.
  const readTimers = useRef({});
  const markRead = (roomId) => {
    if (!roomId) return;
    clearTimeout(readTimers.current[roomId]);
    readTimers.current[roomId] = setTimeout(() => {
      POST(`room/${roomId}/read`).catch(() => {});
    }, 1000);
  };

  // Chats the user muted: they never show unread badges. Kept on the server so
  // muting applies on every device; a ref lets socket handlers see the latest list.
  const [mutedRooms, setMutedRooms] = useState([]);
  const mutedRoomsRef = useRef(mutedRooms);
  mutedRoomsRef.current = mutedRooms;
  const isMuted = (roomId) => mutedRooms.includes(String(roomId));

  const addUnread = (roomId) => {
    if (mutedRoomsRef.current.includes(String(roomId))) return;
    setUnreadCounts((prev) => ({ ...prev, [roomId]: (prev[roomId] || 0) + 1 }));
  };

  const clearUnread = (roomId) => {
    markRead(roomId);
    setUnreadCounts((prev) => {
      if (!prev[roomId]) return prev;
      const next = { ...prev };
      delete next[roomId];
      return next;
    });
  };

  // Load the real counts from the server (on sign-in, app open and reconnect)
  const syncUnread = async () => {
    if (!getToken()) return;
    try {
      const response = await GET("room/unread");
      if (!response?.success) return;
      setMutedRooms(response.muted || []);
      const counts = { ...response.data };
      // The chat on screen is being read right now
      const openRoom = chatRoomIdRef.current;
      if (openRoom && counts[openRoom]) {
        delete counts[openRoom];
        markRead(openRoom);
      }
      setUnreadCounts(counts);
    } catch {
      // keep the current counts; the next sync will correct them
    }
  };

  useEffect(() => {
    if (userData) syncUnread();
  }, [userData]);

  // Mute or unmute a chat; throws if the server refuses, so the caller can show it
  const setRoomMuted = async (roomId, muted) => {
    const response = await POST(`room/${roomId}/mute`, {}, {}, { muted });
    setMutedRooms(response?.muted || []);
    if (muted) {
      setUnreadCounts((prev) => {
        if (!prev[roomId]) return prev;
        const next = { ...prev };
        delete next[roomId];
        return next;
      });
    }
  };

  // After renaming in Settings: show the new name here and use it for new messages
  const updateUserName = (name) => {
    setUserData((prev) => (prev ? { ...prev, user: { ...prev.user, name } } : prev));
    socket.emit("refresh-profile");
  };

  const totalUnread = Object.values(unreadCounts).reduce((sum, n) => sum + n, 0);

  useEffect(() => {
    if (userData) {
      appStorage().setItem("userData", JSON.stringify(userData));
    } else {
      appStorage().removeItem("userData");
    }
  }, [userData]);

  const handleChatRoomIdChange = (newChatRoomId) => {
    setChatRoomId(newChatRoomId);
    appStorage().setItem("chatRoomId", newChatRoomId);
  };

  useEffect(() => {
    if (chatRoomId) {
      appStorage().setItem("chatRoomId", chatRoomId);
    } else {
      appStorage().removeItem("chatRoomId");
    }
  }, [chatRoomId]);

  const handlePartnerChange = (data) => {
    setCurrentPartner(data);
    appStorage().setItem("currentPartner", JSON.stringify(data));
  };

  // Keep the open chat partner's online status / last seen current. Does nothing
  // unless `user` is the person being chatted with, so it's safe to call for anyone.
  const updatePartnerStatus = (user) => {
    if (!user?._id) return;
    setCurrentPartner((prev) => {
      if (!prev?._id || String(prev._id) !== String(user._id)) return prev;
      if (prev.isOnline === user.isOnline && prev.lastSeen === user.lastSeen) return prev;
      const next = { ...prev, isOnline: user.isOnline, lastSeen: user.lastSeen };
      appStorage().setItem("currentPartner", JSON.stringify(next));
      return next;
    });
  };

  const handleFriendRoom = (data) => {
    setFriendRoom(data);
    appStorage().setItem("friendRoom", JSON.stringify(data));
  };

  const handleRoomTypeChange = (newRoomType) => {
    setRoomType(newRoomType);
    appStorage().setItem("roomType", newRoomType);
  };

  const login = (data) => {
    setUserData(data);
    setChatRoomId(data?.user?.publicRoomId || null);
    setRoomType("public");
  };

  const logout = () => {
    setUserData(null);
    setChatRoomId(null);
    setRoomType(null);
    setUnreadCounts({});
    setMutedRooms([]);
    clearSession();
  };

  // End the session cleanly when the login token expires, instead of leaving
  // a chat screen that silently can't load or send anything
  useEffect(() => {
    if (!userData) return;

    const endSession = () => {
      logout();
      toast.error("Your session expired. Please sign in again.", { id: "session-expired" });
    };

    const expiry = getTokenExpiry(getToken());
    if (!expiry || expiry <= Date.now()) {
      endSession();
      return;
    }

    // setTimeout can't wait longer than ~24.8 days
    const timer = setTimeout(endSession, Math.min(expiry - Date.now(), 2 ** 31 - 1));
    window.addEventListener(SESSION_EXPIRED_EVENT, endSession);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(SESSION_EXPIRED_EVENT, endSession);
    };
  }, [userData]);

  return (
    <AuthContext.Provider
      value={{
        userData,
        friendRoom,
        handleFriendRoom,
        chatRoomId,
        roomType,
        setRoomType,
        login,
        handleRoomTypeChange,
        logout,
        handleChatRoomIdChange,
        handlePartnerChange,
        updatePartnerStatus,
        currentPartner,
        unreadCounts,
        totalUnread,
        addUnread,
        clearUnread,
        markRead,
        syncUnread,
        mutedRooms,
        isMuted,
        setRoomMuted,
        updateUserName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
