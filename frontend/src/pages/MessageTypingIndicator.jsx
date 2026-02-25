// import React, { useState, useEffect } from "react";
// import socket from "../Socket";

// const MessageTypingIndicator = () => {
//   const [typingUsers, setTypingUsers] = useState(new Set());

//   const handleUserTyping = ({ userId, name }) => {
//     setTypingUsers((prev) => {
//       const updatedUsers = new Set(prev);
//       updatedUsers.add({ userId, name });
//       return updatedUsers;
//     });
//   };

//   const handleUserStopTyping = ({ userId, name }) => {
//     setTypingUsers((prev) => {
//       const updatedUsers = new Set(
//         [...prev].filter((user) => user.userId !== userId),
//       );

//       return updatedUsers;
//     });
//   };

//   useEffect(() => {
//     socket.on("userTyping", handleUserTyping);
//     socket.on("userStopTyping", handleUserStopTyping);
//   }, []);

//   return <div>
// {typingUsers.size===1&&(<p>
//     {[...typingUsers][0].name}
// </p>)}
// {typingUsers.size}
//   </div>;
// };

// export default MessageTypingIndicator;


import React, { useState, useEffect } from "react";
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
      {usersArray.length === 1 && (
        <p>{usersArray[0]} is typing...</p>
      )}

      {usersArray.length > 1 && (
        <p>Multiple people are typing...</p>
      )}
    </div>
  );
};

export default MessageTypingIndicator;