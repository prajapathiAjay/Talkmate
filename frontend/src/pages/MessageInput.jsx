import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useAuth } from "../contexts/AuthContext.js";
import socket from "../Socket";
import CustomeApiService from "../services/CustomApiService.jsx";
import { SendHorizonal, Loader2, Paperclip, MessagesSquare, Camera, Image as ImageIcon } from "lucide-react";
import CameraCapture from "../components/CameraCapture.jsx";
import { toast } from "sonner";

// The emoji picker and its emoji list are large, so they load the first time
// the picker is opened instead of with the app
const Picker = lazy(() => import("@emoji-mart/react"));
const loadEmojiData = () => import("@emoji-mart/data").then((module) => module.default);

// Must match the backend's upload limits (backend/src/middlewares/upload.js)
const MAX_FILES = 3;
const MAX_FILE_SIZE_MB = 10;
const ACCEPTED_IMAGES = "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif";

// Preview of a photo picked for sending. The blob: link is made once per photo
// and released when the photo is removed or sent; making it during render would
// create a new link on every keystroke and keep removed photos in memory.
const FilePreview = ({ file }) => {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  if (!url) return <div className="w-full h-28 bg-white/40" />;
  return <img src={url} alt="Preview" className="w-full h-28 object-cover" />;
};

const MessageInput = ({ disabled = false, handleShowOnlineUsers }) => {
  const { POST } = CustomeApiService();

  const { userData, chatRoomId, totalUnread } = useAuth();
  const [newMsg, setNewMsg] = useState("");
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const attachMenuRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Add to the current selection (so several camera shots can be sent together)
  const addFiles = (newFiles) => {
    if (!newFiles?.length) return;

    const fitting = newFiles.filter((file) => file.size <= MAX_FILE_SIZE_MB * 1024 * 1024);
    if (fitting.length < newFiles.length) {
      toast.error(`Each photo must be under ${MAX_FILE_SIZE_MB} MB`);
    }

    setFiles((prev) => {
      if (prev.length + fitting.length > MAX_FILES) {
        toast.error(`You can send up to ${MAX_FILES} photos at a time`, { id: "max-files" });
      }
      return [...prev, ...fitting].slice(0, MAX_FILES);
    });
  };

  const handlePickedFiles = (e) => {
    addFiles([...e.target.files]);
    e.target.value = ""; // allow picking the same file again
    setShowAttachMenu(false);
  };

  const openFiles = () => {
    setShowAttachMenu(false);
    setShowCamera(false);
    fileInputRef.current?.click();
  };

  // Phones open their own camera from <input capture>; elsewhere use the in-app camera
  const openCamera = () => {
    setShowAttachMenu(false);
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
    if (isTouchDevice) {
      cameraInputRef.current?.click();
    } else {
      setShowCamera(true);
    }
  };
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

  // Close the emoji picker / attach menu on outside click (toggle buttons handle themselves)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(event.target)) {
        setShowAttachMenu(false);
      }
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

  // Switching chats while typing: stop typing in the chat being left (the cleanup
  // runs with that chat's id), so typing in the next chat is announced right away
  useEffect(() => stopTyping, [chatRoomId]);

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

    // Offline: say so now and keep the text, instead of queueing a message that may never go
    if (!socket.connected) {
      toast.error("You're offline. Check your connection and try again.", { id: "send-offline" });
      return;
    }

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

      // The box clears right away so sending feels instant; if the server doesn't
      // confirm within 10s (or says it failed), the text and photos are put back
      const sentText = newMsg;
      const sentFiles = files;
      socket.timeout(10000).emit("sendMessage", messageData, (timedOut, response) => {
        if (!timedOut && response?.success !== false) return;

        toast.error(
          timedOut
            ? "Message not sent - the server didn't respond. Please try again."
            : response?.message || "Message could not be sent",
        );
        // Restore only into an empty box, never over something new the user typed
        setNewMsg((current) => (current.trim() ? current : sentText));
        setFiles((current) => (current.length ? current : sentFiles));
      });
      stopTyping();

      setNewMsg("");
      setFiles([]);
    } catch (err) {
      // e.g. a photo too large or in a format the server doesn't accept
      toast.error(err?.message || "Photo could not be sent");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="glass-pane border-t border-white/60 px-2 py-2 sm:px-3 lg:py-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="relative max-w-6xl mx-auto">
        <div className="flex items-end gap-1 sm:gap-2">
          {/* Chats: opens the people panel (it's always visible on lg+) */}
          <button
            onClick={handleShowOnlineUsers}
            title="Chats"
            aria-label={totalUnread ? `Chats, ${totalUnread} unread` : "Chats"}
            className="lg:hidden relative shrink-0 p-2 mb-0.5 rounded-xl hover:bg-white/60 transition-colors"
          >
            <MessagesSquare className="w-5 h-5 sm:w-6 sm:h-6 text-violet-600" />
            {totalUnread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold leading-none ring-2 ring-white animate-[pop_0.25s_ease-out]">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </button>
          <button
            ref={emojiButtonRef}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Emoji"
            className="shrink-0 p-2 mb-0.5 hover:bg-white/60 rounded-xl transition-colors"
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
            <div className="absolute bottom-full mb-3 w-full max-w-xl surface-raised shadow-2xl shadow-gray-900/10 rounded-2xl z-50">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/60 rounded-t-2xl">
                <h3 className="text-sm font-semibold text-gray-800">
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
                    className="relative group border border-white/70 rounded-xl overflow-hidden bg-white/50"
                  >
                    {/* Image */}
                    <FilePreview file={file} />

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="absolute top-1 right-1 bg-black/60 text-white text-xs w-6 h-6 rounded-full opacity-100 group-hover:opacity-100 transition"
                    >
                      ✕
                    </button>

                    {/* File Info */}
                    <div className="p-2 text-xs">
                      <p className="truncate font-medium text-gray-800">
                        {file.name}
                      </p>
                      <p className="text-gray-500">{file.type || "file"}</p>
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
              <Suspense
                fallback={
                  <div className="w-[352px] max-w-full h-[435px] rounded-xl glass-pane flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                  </div>
                }
              >
                <Picker
                  data={loadEmojiData}
                  onEmojiSelect={handleEmojiSelect}
                  previewPosition="none"
                  theme="light"
                />
              </Suspense>
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
              className={`block w-full resize-none overflow-y-auto max-h-32 placeholder:whitespace-nowrap placeholder:overflow-hidden placeholder:text-ellipsis pl-4 pr-11 py-2.5 sm:py-3 leading-6 text-base sm:text-[15px] field rounded-3xl ${
                disabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
            />
            {/* Attach: camera or photos, inside the box like WhatsApp's paperclip */}
            <div ref={attachMenuRef} className="absolute right-1.5 bottom-1 sm:bottom-1.5">
              <button
                type="button"
                onClick={() => setShowAttachMenu((open) => !open)}
                title="Attach images"
                className={`p-2 rounded-full transition-colors ${
                  showAttachMenu ? "text-violet-600 bg-white/70" : "text-gray-500 hover:text-violet-600 hover:bg-white/60"
                }`}
              >
                <Paperclip className="w-5 h-5 -rotate-45" />
              </button>

              {showAttachMenu && (
                <div className="absolute bottom-full right-0 mb-3 w-52 surface-raised rounded-2xl shadow-2xl shadow-gray-900/10 p-1.5 z-50 animate-[pop_0.15s_ease-out] origin-bottom-right">
                  <button
                    type="button"
                    onClick={openCamera}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-800 hover:bg-white/60"
                  >
                    <span className="w-9 h-9 rounded-full bg-gradient-to-br from-fuchsia-500 to-rose-500 text-white flex items-center justify-center">
                      <Camera className="w-4 h-4" />
                    </span>
                    Camera
                  </button>
                  <button
                    type="button"
                    onClick={openFiles}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-800 hover:bg-white/60"
                  >
                    <span className="w-9 h-9 rounded-full brand-bg text-white flex items-center justify-center">
                      <ImageIcon className="w-4 h-4" />
                    </span>
                    Photos &amp; files
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                multiple
                accept={ACCEPTED_IMAGES}
                onChange={handlePickedFiles}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                id="camera-upload"
                type="file"
                accept={ACCEPTED_IMAGES}
                capture="environment"
                onChange={handlePickedFiles}
                className="hidden"
              />
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
        ? "text-white shadow-[0_8px_20px_-8px_rgba(37,99,235,0.6)] hover:scale-105 active:scale-95"
        : "bg-white/60 text-gray-400 cursor-not-allowed"
    }
  `}
          >
            {/* Glow */}
            <div
              className={`absolute inset-0 brand-bg transition-opacity ${
                newMsg.trim() || files.length > 0 ? "opacity-100" : "opacity-0"
              }`}
            />

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

      {showCamera && (
        <CameraCapture
          onCapture={(file) => {
            addFiles([file]);
            setShowCamera(false);
          }}
          onClose={() => setShowCamera(false)}
          onUseFiles={openFiles}
        />
      )}
    </div>
  );
};

export default MessageInput;
