


import React from "react";

const MessageItem = ({ msg, currentUser }) => {
  const isCurrentUser = msg?.senderId !== currentUser;
  const isJoinMessage = msg?.messageType=== "join";

  if (isJoinMessage) {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium border border-blue-200">
          {msg?.message}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} mb-4 px-4`}
    >
      <div className={`flex ${isCurrentUser ? "flex-row-reverse" : "flex-row"} max-w-[70%]`}>
        {!isCurrentUser && (
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-2 flex-shrink-0">
            {msg?.senderName?.charAt(0)?.toUpperCase() || "U"}
          </div>
        )}
        
        <div
          className={`flex flex-col ${
            isCurrentUser ? "items-end" : "items-start"
          } flex-1 min-w-0`}
        >
          {!isCurrentUser && (
            <p className="font-semibold text-gray-700 text-xs mb-1 ml-1">
              {msg?.senderName}
            </p>
          )}
          
          <div
            className={`px-4 py-2 rounded-2xl shadow-sm max-w-full ${
              isCurrentUser
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-none"
                : "bg-white text-gray-800 rounded-bl-none border border-gray-100"
            }`}
          >
            <p className="text-sm break-words whitespace-pre-wrap">{msg?.message}</p>
          </div>
          
          <span className="text-xs text-gray-500 mt-1 px-1">
            {msg?.createdAt}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;