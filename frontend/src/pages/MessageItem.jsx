import { useState, useEffect } from "react";

const Lightbox = ({ images, startIndex, onClose }) => {
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
      className="fixed inset-0 bg-black/85 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <button
        className="absolute top-4 right-4 text-white text-4xl font-bold hover:text-gray-300 z-10"
        onClick={onClose}
      >
        &times;
      </button>

      {index > 0 && (
        <button
          className="absolute left-4 text-white text-5xl font-bold hover:text-gray-300 w-12 h-12 flex items-center justify-center bg-black/30 rounded-full"
          onClick={() => setIndex(prev => prev - 1)}
        >
          ‹
        </button>
      )}

      <div className="relative flex flex-col items-center">
        <img
          src={images[index]?.fileUrl}
          alt={images[index]?.fileName || "Lightbox image"}
          className="max-h-[85vh] max-w-[85vw] object-contain rounded-md"
        />
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
          {index + 1} / {images.length}
        </div>
      </div>

      {index < images.length - 1 && (
        <button
          className="absolute right-4 text-white text-5xl font-bold hover:text-gray-300 w-12 h-12 flex items-center justify-center bg-black/30 rounded-full"
          onClick={() => setIndex(prev => prev + 1)}
        >
          ›
        </button>
      )}
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
        <div className="text-gray-600 px-4 py-1 rounded-full text-xs font-normal ">
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
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-2 flex-shrink-0">
              {msg?.senderName?.charAt(0)?.toUpperCase() || "U"}
            </div>
          )}

          <div className={`flex flex-col ${!isCurrentUser && isSameSenderAsPrev ? "ml-10" : ""} ${isCurrentUser ? "items-end" : "items-start"} min-w-0`}>
            {!isCurrentUser && !isSameSenderAsPrev && (
              <p className="font-semibold text-gray-700 text-xs mb-1 ml-1">{msg?.senderName}</p>
            )}

            {imageOnly ? (
              // Photos without text: thin neutral frame, time laid over the image
              <div className={`relative p-1 bg-white border border-gray-100 shadow-sm rounded-2xl ${isCurrentUser ? "rounded-br-sm" : "rounded-bl-sm"}`}>
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
                  ? "bg-gradient-to-r from-violet-600 to-indigo-500 text-white rounded-br-sm"
                  : "bg-white text-gray-800 rounded-bl-sm border border-gray-100"
              }`}>
                {msg?.message && (
                  <p className="text-[15px] sm:text-sm leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">{msg?.message}</p>
                )}

                {images.length > 0 && (
                  <div className="mt-2 w-60 max-w-full sm:w-72 overflow-hidden rounded-xl">
                    {renderImageGrid()}
                  </div>
                )}

                <p className={`text-[10px] leading-none mt-1 text-right select-none ${isCurrentUser ? "text-white/70" : "text-gray-400"}`}>
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
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
};

export default MessageItem;
