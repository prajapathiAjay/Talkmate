import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthProvider";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import socket from "../Socket";
import CustomeApiService from "../services/CustomApiService.jsx";

const MessageInput = ({ roomType, disabled = false }) => {
  const { POST } = CustomeApiService();

  const { userData } = useAuth();
  const [newMsg, setNewMsg] = useState("");
  const [files, setFiles] = useState([]);
  let userName = userData?.user?.name;
  let userId = userData?.user?.userId;
  let publicRoomId = userData?.user?.publicRoomId;
  const TypingTimeOutRef = useRef(null);
  const isTypingRef = useRef(false);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  console.log("all files", files);
  //

  const onKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleTypingMessage = (value) => {
    setNewMsg(value);

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit("typing", {
        name: userName,
        roomId: publicRoomId,
        userId: userId,
      });

      clearTimeout(TypingTimeOutRef.current);

      TypingTimeOutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        socket.emit("stop-typing", {
          name: userName,
          roomId: publicRoomId,
          userId: userId,
        });
      }, 2000);
    }
  };

  useEffect(() => {}, []);
  const handleEmojiSelect = (emoji) => {
    const emojiChar = emoji.native;
    setNewMsg((prev) => prev + emojiChar);
    // setShowEmojiPicker(false);
  };
  const onSend = async () => {
    setShowEmojiPicker(false);
    if (!newMsg.trim() && files.length === 0) return;
    console.log("sending message", { newMsg, files });

    let uploadedFiles = [];
    
    console.log("files state", files);
    console.log("is array:", Array.isArray(files));
    if (files.length > 0) {
      const formData = new FormData();

      files.forEach((file) => {
        formData.append("files", file);
      });
      console.log("form data", formData.getAll("files"));
      try {
        const res = await POST("upload/messages", {}, {}, formData);

        console.log("file upload response", res);

        uploadedFiles = res?.files || [];
      } catch (err) {
        console.error("Upload error", err);
      }
    }

    const messageData = {
      senderId: userId,
      senderName: userName,
      message: newMsg,
      attachments: uploadedFiles,
    };

    if (roomType === "public") {
      messageData.roomId = publicRoomId;
    }

    socket.emit("sendMessage", messageData, (res) => {
      console.log("server", res);
      console.log("message sent", messageData);
    });

    setNewMsg("");
    setFiles([]);
  };
  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className=" relative max-w-6xl mx-auto">
        <div className="flex items-center space-x-3">
          {/* <button
            title="Attach file"
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
          >

         <input type="file" multiple onChange={(e)=>setFile(e.target.value)} className="hidden" id="file-upload" />
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
          </button> */}
          <label
            htmlFor="file-upload"
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
          >
            <input
              type="file"
              multiple
              onChange={(e) => setFiles([...e.target.files])}
              className="hidden"
              id="file-upload"
            />

            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
          </label>
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Emoji"
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>

          {files.length > 0 && (
            <div className="absolute bottom-full mb-2 z-999  bg-red-500">
              <div className="flex  items-center space-x-2 m-2">
                <div>Selected Documents</div>
                {files.map((file, index) => (
                  <div key={index} className="">
                    <img
                      src={URL.createObjectURL(file)}
                      alt="Preview"
                      className="w-64 h-64 object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          {showEmojiPicker && (
            <div className="absolute bottom-full mb-2 z-9999">
              <Picker data={data} onEmojiSelect={handleEmojiSelect} />
            </div>
          )}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Type your message..."
              value={newMsg}
              onChange={(e) => handleTypingMessage(e.target.value)}
              onKeyPress={onKeyPress}
              disabled={disabled}
              className={`w-full px-4 py-3 pl-12 bg-gray-50 border text-black border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all ${
                disabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
          </div>

          <button
            onClick={onSend}
            disabled={(!newMsg.trim() && files.length === 0) || disabled}
            className={`px-6 py-3 rounded-2xl font-medium transition-all duration-200 ${
              newMsg.trim() || files.length > 0
                ? "bg-linear-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Send
          </button>
        </div>

        {/* <div className="mt-2 text-xs text-gray-500 text-center">
          Press Enter to send, Shift+Enter for new line
        </div> */}
      </div>
    </div>
  );
};

export default MessageInput;
