import { createContext, useState, useContext, useEffect } from "react";
import { toast } from "sonner";
import { SESSION_EXPIRED_EVENT, getTokenExpiry } from "../utils/session.js";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(() => {
    const availableUser = localStorage.getItem("userData");
    return availableUser ? JSON.parse(availableUser) : null;
  });

  const [currentPartner, setCurrentPartner] = useState(() => {
    const availablePartner = localStorage.getItem("currentPartner");
    return availablePartner ? JSON.parse(availablePartner) : { type: "public" };
  });

  const [friendRoom, setFriendRoom] = useState(() => {
    const availableFriends = localStorage.getItem("friendRoom");
    return availableFriends ? JSON.parse(availableFriends) : [];
  });

  const [roomType, setRoomType] = useState(() => {
    const availableRoomType = localStorage.getItem("roomType");
    return availableRoomType ? availableRoomType : "public";
  });

  const [chatRoomId, setChatRoomId] = useState(() =>
    localStorage.getItem("chatRoomId")
  );

  // Unread message counts per room id, e.g. { "<roomId>": 3 }
  const [unreadCounts, setUnreadCounts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("unreadCounts")) || {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem("unreadCounts", JSON.stringify(unreadCounts));
  }, [unreadCounts]);

  const addUnread = (roomId) => {
    setUnreadCounts((prev) => ({ ...prev, [roomId]: (prev[roomId] || 0) + 1 }));
  };

  const clearUnread = (roomId) => {
    setUnreadCounts((prev) => {
      if (!prev[roomId]) return prev;
      const next = { ...prev };
      delete next[roomId];
      return next;
    });
  };

  const totalUnread = Object.values(unreadCounts).reduce((sum, n) => sum + n, 0);

  useEffect(() => {
    if (userData) {
      localStorage.setItem("userData", JSON.stringify(userData));
    } else {
      localStorage.removeItem("userData");
    }
  }, [userData]);

  const handleChatRoomIdChange = (newChatRoomId) => {
    setChatRoomId(newChatRoomId);
    localStorage.setItem("chatRoomId", newChatRoomId);
  };

  useEffect(() => {
    if (chatRoomId) {
      localStorage.setItem("chatRoomId", chatRoomId);
    } else {
      localStorage.removeItem("chatRoomId");
    }
  }, [chatRoomId]);

  const handlePartnerChange = (data) => {
    setCurrentPartner(data);
    localStorage.setItem("currentPartner", JSON.stringify(data));
  };

  const handleFriendRoom = (data) => {
    setFriendRoom(data);
    localStorage.setItem("friendRoom", JSON.stringify(data));
  };

  const handleRoomTypeChange = (newRoomType) => {
    setRoomType(newRoomType);
    localStorage.setItem("roomType", newRoomType);
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
    localStorage.clear();
  };

  // End the session cleanly when the login token expires, instead of leaving
  // a chat screen that silently can't load or send anything
  useEffect(() => {
    if (!userData) return;

    const endSession = () => {
      logout();
      toast.error("Your session expired. Please sign in again.", { id: "session-expired" });
    };

    const expiry = getTokenExpiry(localStorage.getItem("token"));
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
        currentPartner,
        unreadCounts,
        totalUnread,
        addUnread,
        clearUnread,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

export const useAuth = () => {
  return useContext(AuthContext);
};
