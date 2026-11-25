import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthProvider";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import socket from "../Socket";
import CustomeApiService from "../services/CustomApiService.jsx";
import { SendHorizonal, Loader2, ImagePlusIcon } from "lucide-react";

const MessageInput = ({ disabled = false }) => {
  const { POST } = CustomeApiService();

  const { userData, chatRoomId } = useAuth();
  const [newMsg, setNewMsg] = useState("");
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const userName = userData?.user?.name;
  const userId = userData?.user?.userId;
  const TypingTimeOutRef = useRef(null);
  const isTypingRef = useRef(false);
  const emojiPickerRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const textareaRef = useRef(null);

  // Enter sends, Shift+Enter adds a new line (ignored while an IME is composing)
  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      onSend();
    }
  };

  // Grow the textarea with its content, up to ~5 lines
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [newMsg]);

  // Close the emoji picker on outside click (the toggle button handles itself)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target) &&
        !emojiButtonRef.current?.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleTypingMessage = (value) => {
    setNewMsg(value);

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit("typing", {
        name: userName,
        roomId: chatRoomId,
        userId: userId,
      });

      clearTimeout(TypingTimeOutRef.current);

      TypingTimeOutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        socket.emit("stop-typing", {
          name: userName,
          roomId: chatRoomId,
          userId: userId,
        });
      }, 2000);
    }
  };

  const stopTyping = () => {
    clearTimeout(TypingTimeOutRef.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      socket.emit("stop-typing", {
        name: userName,
        roomId: chatRoomId,
        userId: userId,
      });
    }
  };

  const handleEmojiSelect = (emoji) => {
    const emojiChar = emoji.native;
    setNewMsg((prev) => prev + emojiChar);
  };

  const handleRemoveFile = (indexToRemove) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleRemoveAllFiles = () => {
    setFiles([]);
  };

  const onSend = async () => {
    setShowEmojiPicker(false);

    if (!newMsg.trim() && files.length === 0) return;

    setSending(true);

    try {
      let uploadedFiles = [];

      if (files.length > 0) {
        const formData = new FormData();

        files.forEach((file) => {
          formData.append("files", file);
        });

        const res = await POST("upload/messages", {}, {}, formData);

        uploadedFiles = res?.files || [];
      }

      const messageData = {
        senderId: userId,
        senderName: userName,
        message: newMsg,
        attachments: uploadedFiles,
        roomId: chatRoomId,
      };

      socket.emit("sendMessage", messageData);
      stopTyping();

      setNewMsg("");
      setFiles([]);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 px-2 py-2 sm:px-3 lg:py-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="relative max-w-6xl mx-auto">
        <div className="flex items-end gap-1 sm:gap-2">
          <label
            htmlFor="file-upload"
            title="Attach images"
            className="shrink-0 p-2 mb-0.5 text-gray-500 hover:bg-violet-50 rounded-xl transition-colors cursor-pointer"
          >
            <input
              type="file"
              multiple
              onChange={(e) => setFiles([...e.target.files])}
              className="hidden"
              id="file-upload"
            />
            <ImagePlusIcon className="h-5 w-5 sm:h-6 sm:w-6 text-violet-600" />
          </label>
          <button
            ref={emojiButtonRef}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Emoji"
            className="shrink-0 p-2 mb-0.5 text-gray-500 hover:bg-violet-50 rounded-xl transition-colors"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 text-violet-600"
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
            <div className="absolute bottom-full mb-3 w-full max-w-xl bg-white border border-gray-200 shadow-xl rounded-xl z-50">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 rounded-t-xl">
                <h3 className="text-sm font-semibold text-gray-700">
                  Selected Files ({files.length})
                </h3>

                <button
                  onClick={handleRemoveAllFiles}
                  className="text-xs px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition"
                >
                  Clear All
                </button>
              </div>

              {/* Files Grid */}
              <div className="max-h-64 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="relative group border rounded-lg overflow-hidden bg-gray-50"
                  >
                    {/* Image */}
                    <img
                      src={URL.createObjectURL(file)}
                      alt="Preview"
                      className="w-full h-28 object-cover"
                    />

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="absolute top-1 right-1 bg-black/60 text-white text-xs w-6 h-6 rounded-full opacity-100 group-hover:opacity-100 transition"
                    >
                      ✕
                    </button>

                    {/* File Info */}
                    <div className="p-2 text-xs">
                      <p className="truncate font-medium text-gray-700">
                        {file.name}
                      </p>
                      <p className="text-gray-400">{file.type || "file"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {showEmojiPicker && (
            <div
              className="absolute bottom-full left-0 mb-2 z-50 max-w-full"
              ref={emojiPickerRef}
            >
              <Picker
                data={data}
                onEmojiSelect={handleEmojiSelect}
                previewPosition="none"
                theme="light"
              />
            </div>
          )}
          <div className="flex-1 min-w-0 relative">
            {/* text-base on mobile stops iOS from zooming into the field */}
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="Type your message..."
              value={newMsg}
              onChange={(e) => handleTypingMessage(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={disabled}
              className={`block w-full resize-none overflow-y-auto max-h-32 placeholder:whitespace-nowrap placeholder:overflow-hidden placeholder:text-ellipsis px-4 py-2.5 sm:py-3 pl-10 sm:pl-12 leading-6 text-base sm:text-[15px] bg-gray-50 border text-black border-gray-200 rounded-3xl focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-[box-shadow,border-color] ${
                disabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
            />
            <div className="absolute left-3.5 sm:left-4 bottom-3 sm:bottom-3.5 text-gray-400 pointer-events-none">
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
            disabled={
              (!newMsg.trim() && files.length === 0) || disabled || sending
            }
            title="Send"
            className={`
    group relative overflow-hidden shrink-0
    w-11 h-11 sm:w-12 sm:h-12 rounded-full
    flex items-center justify-center
    transition-all duration-300 ease-out
    ${
      newMsg.trim() || files.length > 0
        ? `
          bg-white/10 backdrop-blur-xl
          border border-white/20
          text-white
          shadow-[0_8px_32px_rgba(59,130,246,0.35)]
          hover:scale-110
          hover:rotate-12
          hover:shadow-[0_12px_40px_rgba(168,85,247,0.5)]
          active:scale-95
        `
        : `
          bg-gray-100
          text-gray-400
          cursor-not-allowed
        `
    }
  `}
          >
            {/* Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-500" />

            {/* Shine effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-linear-to-r from-transparent via-white/30 to-transparent" />

            <span className="relative z-10">
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <SendHorizonal className="w-5 h-5" />
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
