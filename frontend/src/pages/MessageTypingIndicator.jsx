import { useState, useEffect } from "react";
import socket from "../Socket";

const MessageTypingIndicator = () => {
  const [typingUsers, setTypingUsers] = useState(new Map());

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

  return (
    <div>
      {usersArray.length === 1 && <p>{usersArray[0]} is typing...</p>}

      {usersArray.length > 1 && <p>Multiple people are typing...</p>}
    </div>
  );
};

export default MessageTypingIndicator;
