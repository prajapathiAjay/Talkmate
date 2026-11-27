import { useState, useEffect } from "react";
import { avatarGradient } from "../utils/avatarColor.js";

// "Today at 12:41 pm", "Yesterday at 9:05 am" or "21 Jul 2026 at 7:37 am"
const formatSentAt = (date) => {
  if (!date) return "";
  const sent = new Date(date);
  const time = sent.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (sent.toDateString() === new Date().toDateString()) return `Today at ${time}`;
  if (sent.toDateString() === yesterday.toDateString()) return `Yesterday at ${time}`;
  return `${sent.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} at ${time}`;
};

const Lightbox = ({ images, startIndex, onClose, senderName, sentAt }) => {
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        setIndex(prev => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === "ArrowRight") {
        setIndex(prev => (prev < images.length - 1 ? prev + 1 : prev));
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [images.length, onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!images || images.length === 0) return null;

  return (
    <div
      className="fixed inset-0 bg-white flex items-center justify-center z-50 pt-20 pb-4"
      onClick={handleBackdropClick}
    >
      {/* Header: who sent it and when, plus close - frosted glass in the app's gradient */}
      <div
        className="absolute top-3 inset-x-3 z-10 flex items-center gap-3 min-w-0 px-4 py-2.5 rounded-2xl text-white border border-white/30 shadow-[0_12px_32px_-12px_rgba(139,92,246,0.6)] backdrop-blur-xl"
        style={{ backgroundImage: "linear-gradient(135deg, rgba(59,130,246,0.82) 0%, rgba(139,92,246,0.82) 52%, rgba(236,72,153,0.82) 100%)" }}
      >
        <div className={`w-10 h-10 shrink-0 rounded-full bg-gradient-to-br ${avatarGradient(senderName)} flex items-center justify-center font-bold ring-2 ring-white/70`}>
          {senderName?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{senderName}</p>
          <p className="text-xs text-white/80 truncate">{sentAt}</p>
        </div>
        <button
          className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-3xl leading-none text-white/90 hover:text-white hover:bg-white/20 transition-colors"
          onClick={onClose}
          title="Close"
        >
          &times;
        </button>
      </div>

      {/* Arrows sit right beside the photo; a hidden one keeps the photo centred at the ends */}
      <button
        className={`shrink-0 mr-3 text-gray-700 text-5xl font-bold w-12 h-12 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full ${index > 0 ? "" : "invisible"}`}
        onClick={() => setIndex(prev => prev - 1)}
      >
        ‹
      </button>

      <div className="relative flex flex-col items-center">
        <img
          src={images[index]?.fileUrl}
          alt={images[index]?.fileName || "Lightbox image"}
          className={`${images.length > 1 ? "max-h-[calc(100vh-15rem)]" : "max-h-[80vh]"} max-w-[calc(100vw-10rem)] object-contain rounded-md shadow-lg`}
        />

        {/* Below the photo, not on it: position and a preview of every photo */}
        {images.length > 1 && (
          <>
            <p className="mt-3 text-sm font-medium text-gray-600">
              {index + 1} / {images.length}
            </p>
            <div className="mt-3 flex gap-2 max-w-[calc(100vw-10rem)] overflow-x-auto p-1">
              {images.map((image, i) => (
                <button
                  key={image.fileUrl + i}
                  onClick={() => setIndex(i)}
                  title={`Photo ${i + 1}`}
                  className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden transition-all ${
                    i === index
                      ? "ring-2 ring-violet-500 ring-offset-2"
                      : "opacity-50 hover:opacity-100"
                  }`}
                >
                  <img src={image.fileUrl} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <button
        className={`shrink-0 ml-3 text-gray-700 text-5xl font-bold w-12 h-12 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full ${index < images.length - 1 ? "" : "invisible"}`}
        onClick={() => setIndex(prev => prev + 1)}
      >
        ›
      </button>
    </div>
  );
};

const MessageItem = ({ msg, currentUser, prevMessage }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxStart, setLightboxStart] = useState(0);

  const isCurrentUser = msg?.senderId === currentUser;
  const isJoinMessage = msg?.messageType === "join";
  const isSameSenderAsPrev = prevMessage && prevMessage?.senderId === msg?.senderId;

  if (isJoinMessage) {
    return (
      <div className="flex justify-center my-2">
        <div className="text-gray-500 px-4 py-1 rounded-full text-xs font-normal">
          {msg?.message}
        </div>
      </div>
    );
  }

  const images = msg?.attachments?.filter(file => file.fileType?.startsWith("image/")) || [];
  const remainingCount = images.length - 4;
  const imageOnly = images.length > 0 && !msg?.message?.trim();

  const handleOpenLightbox = (startIndex) => {
    setLightboxStart(startIndex);
    setLightboxOpen(true);
  };

  const formatMessageTime = (date) => {
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const renderImageGrid = () => {
    if (images.length === 0) return null;

    if (images.length === 1) {
      return (
        <img
          src={images[0].fileUrl}
          alt={images[0].fileName}
          className="object-cover w-full h-48 rounded-md cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => handleOpenLightbox(0)}
        />
      );
    }

    if (images.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-1">
          {images.map((img, idx) => (
            <img
              key={idx}
              src={img.fileUrl}
              alt={img.fileName}
              className="object-cover w-full h-48 rounded-md cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => handleOpenLightbox(idx)}
            />
          ))}
        </div>
      );
    }

    if (images.length === 3) {
      return (
        <div className="grid grid-cols-2 gap-1">
          <img
            src={images[0].fileUrl}
            alt={images[0].fileName}
            className="object-cover w-full h-48 col-span-2 rounded-md cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => handleOpenLightbox(0)}
          />
          <img
            src={images[1].fileUrl}
            alt={images[1].fileName}
            className="object-cover w-full h-24 rounded-md cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => handleOpenLightbox(1)}
          />
          <img
            src={images[2].fileUrl}
            alt={images[2].fileName}
            className="object-cover w-full h-24 rounded-md cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => handleOpenLightbox(2)}
          />
        </div>
      );
    }

    if (images.length >= 4) {
      return (
        <div className="grid grid-cols-2 gap-1">
          {images.slice(0, 4).map((img, idx) => (
            <div key={idx} className="relative">
              <img
                src={img.fileUrl}
                alt={img.fileName}
                className="object-cover w-full h-24 rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => handleOpenLightbox(idx)}
              />
              {idx === 3 && remainingCount > 0 && (
                <div
                  className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md text-white text-lg font-bold cursor-pointer hover:bg-black/60 transition-colors"
                  onClick={() => handleOpenLightbox(idx)}
                >
                  +{remainingCount}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }
  };

  return (
    <>
      <div className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} ${isSameSenderAsPrev ? "mt-1" : "mt-3"}`}>
        <div className={`flex ${isCurrentUser ? "flex-row-reverse" : "flex-row"} max-w-[85%] sm:max-w-[75%] lg:max-w-[65%] min-w-0`}>
          {!isCurrentUser && !isSameSenderAsPrev && (
            <div className={`w-8 h-8 bg-gradient-to-br ${avatarGradient(msg?.senderName)} rounded-full flex items-center justify-center text-white text-sm font-bold mr-2 flex-shrink-0`}>
              {msg?.senderName?.charAt(0)?.toUpperCase() || "U"}
            </div>
          )}

          <div className={`flex flex-col ${!isCurrentUser && isSameSenderAsPrev ? "ml-10" : ""} ${isCurrentUser ? "items-end" : "items-start"} min-w-0`}>
            {!isCurrentUser && !isSameSenderAsPrev && (
              <p className="font-semibold text-gray-500 text-xs mb-1 ml-1">{msg?.senderName}</p>
            )}

            {imageOnly ? (
              // Photos without text: thin neutral frame, time laid over the image
              <div className={`relative p-1 glass-bubble rounded-2xl ${isCurrentUser ? "rounded-br-sm" : "rounded-bl-sm"}`}>
                <div className="w-60 max-w-full sm:w-72 overflow-hidden rounded-xl">
                  {renderImageGrid()}
                </div>
                <span className="absolute bottom-2.5 right-2.5 text-[10px] leading-none text-white bg-black/45 rounded-full px-1.5 py-1 select-none pointer-events-none">
                  {formatMessageTime(msg?.createdAt)}
                </span>
              </div>
            ) : (
              <div className={`px-3.5 py-2 rounded-2xl shadow-sm max-w-full ${
                isCurrentUser
                  ? "brand-bg text-white rounded-br-sm shadow-[0_8px_20px_-10px_rgba(139,92,246,0.7)]"
                  : "glass-bubble text-gray-900 rounded-bl-sm"
              }`}>
                {msg?.message && (
                  <p className="select-text text-[15px] sm:text-sm leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">{msg?.message}</p>
                )}

                {images.length > 0 && (
                  <div className="mt-2 w-60 max-w-full sm:w-72 overflow-hidden rounded-xl">
                    {renderImageGrid()}
                  </div>
                )}

                <p className={`text-[10px] leading-none mt-1 text-right select-none ${isCurrentUser ? "text-white/70" : "text-gray-500"}`}>
                  {formatMessageTime(msg?.createdAt)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {lightboxOpen && (
        <Lightbox
          images={images}
          startIndex={lightboxStart}
          senderName={isCurrentUser ? "You" : msg?.senderName}
          sentAt={formatSentAt(msg?.createdAt)}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
};

export default MessageItem;
