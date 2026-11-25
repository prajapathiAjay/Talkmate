import { useState, useEffect, useRef } from "react";
import socket from "../Socket";
import { avatarGradient } from "../utils/avatarColor.js";

const MessageTypingIndicator = () => {
  const [typingUsers, setTypingUsers] = useState(new Map());
  const indicatorRef = useRef(null);

  const handleUserTyping = ({ userId, name }) => {
    setTypingUsers((prev) => {
      const updated = new Map(prev);
      updated.set(userId, name); // unique by userId
      return updated;
    });
  };

  const handleUserStopTyping = ({ userId }) => {
    setTypingUsers((prev) => {
      const updated = new Map(prev);
      updated.delete(userId);
      return updated;
    });
  };

  useEffect(() => {
    socket.on("userTyping", handleUserTyping);
    socket.on("userStopTyping", handleUserStopTyping);

    return () => {
      socket.off("userTyping", handleUserTyping);
      socket.off("userStopTyping", handleUserStopTyping);
    };
  }, []);

  const usersArray = [...typingUsers.values()];

  // Bring the indicator into view, but only if the reader is already near the bottom
  useEffect(() => {
    const scroller = indicatorRef.current?.closest(".overflow-y-auto");
    if (!scroller) return;
    const distanceFromBottom =
      scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
    if (distanceFromBottom < 150) {
      scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
    }
  }, [usersArray.length]);

  if (usersArray.length === 0) return null;

  const label =
    usersArray.length === 1
      ? `${usersArray[0]} is typing...`
      : "Multiple people are typing...";

  return (
    <div ref={indicatorRef} className="flex items-end gap-2 mt-2 mb-1" aria-live="polite">
      <div className={`w-8 h-8 shrink-0 bg-gradient-to-br ${avatarGradient(usersArray[0])} rounded-full flex items-center justify-center text-white text-sm font-bold`}>
        {usersArray.length === 1 ? usersArray[0]?.charAt(0)?.toUpperCase() : "…"}
      </div>
      <div className="flex flex-col items-start min-w-0">
        <div className="flex items-center gap-1 glass-bubble rounded-2xl rounded-bl-sm px-4 py-3">
          <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" />
        </div>
        <p className="text-[11px] text-gray-500 mt-1 ml-1 truncate max-w-full">{label}</p>
      </div>
    </div>
  );
};

export default MessageTypingIndicator;
