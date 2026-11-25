import { useState, useRef, useEffect } from "react";
import socket from "../Socket.jsx";
import ChatHeader from "./ChatHeader";
import MessageItem from "./MessageItem";
import MessageInput from "./MessageInput";
import { useAuth } from "../contexts/AuthProvider.jsx";
import CustomeApiService from "../services/CustomApiService.jsx";
import MessageTypingIndicator from "./MessageTypingIndicator.jsx";
import OnlineUsers from "./OnlineUsers.jsx";
import FormLayout from "../components/FormLayout.jsx";

const Chat = () => {
  const { GET } = CustomeApiService();
  const { userData, chatRoomId, roomType } = useAuth();
  const userName = userData?.user?.name;
  const [currentUser] = useState(userData?.user?.userId);
  const [messages, setMessages] = useState([]);
  const [editRoom] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);
  const messagesEndRef = useRef(null);

  const handleMessage = (message) => {
    if (message?.success) {
      setMessages((prevMessages) => [...prevMessages, message.data]);
    }
  };

  const fetchAllMessages = async () => {
    const params = {
      roomId: chatRoomId,
    };

    try {
      const response = await GET("messages/getMessages", params, {}, {});

      if (response?.success) {
        const allMessages = response?.data;
        setMessages([...allMessages]);
      }
    } catch (error) {
      console.error("error", error);
    }
  };

  useEffect(() => {
    fetchAllMessages();
  }, []);

  useEffect(() => {
    setMessages([]);
    fetchAllMessages();
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
    };

    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off("connect", joinRoom);
      socket.off("message", handleMessage);
      socket.off("connect_error", handleConnectError);
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

  return (
    <div className="flex h-screen w-screen bg-linear-to-br from-gray-50 to-blue-50">
      {/* Main Chat Area */}
      <div
        className={`flex-1 flex flex-col ${!currentUser ? "opacity-50 pointer-events-none" : ""}`}
      >
        <ChatHeader handleShowOnlineUsers={handleShowOnlineUsers} />

        {/* Messages - scrolling container */}
        <div
          className="flex-1   overflow-y-auto bg-linear-to-b from-white to-gray-50 p-6"
          onScroll={(e) => {
            const { scrollTop, scrollHeight, clientHeight } = e.target;
            setIsAtBottom(scrollHeight - scrollTop <= clientHeight + 50);
          }}
        >
          <div className="w-full lg:max-w-4xl mx-auto">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 text-gray-300"
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
                  <p className="text-lg font-medium">No messages yet</p>
                  <p className="text-sm">
                    Start a conversation by sending a message!
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg, index) => (
                <MessageItem
                  key={index}
                  msg={msg}
                  currentUser={currentUser}
                  prevMessage={messages[index - 1]}
                />
              ))
            )}
            <MessageTypingIndicator />
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <MessageInput disabled={!currentUser} roomType={roomType} />
      </div>
      <OnlineUsers showOnlineUsers={showOnlineUsers} handleShowOnlineUsers={handleShowOnlineUsers} />
      {editRoom && <FormLayout />}
    </div>
  );
};

export default Chat;
