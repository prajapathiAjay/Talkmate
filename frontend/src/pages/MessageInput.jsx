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
  const handleRemoveFile = (indexToRemove) => {
    setFiles((prev)=>prev.filter((_,index)=>index!==indexToRemove))

  }
  const handleRevomeAllFiles=()=>{

    setFiles([])
  }
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

          {/* {files.length > 0 && (
            <div className="absolute bottom-full mb-2 z-999  bg-blue-200">
              <div className="flex flex-col space-x-2 m-2">
                <div className="flex flex-row justify-between  bg-gradient-to-r from-blue-500 to-blue-100">
                  <div className="flex justify-between w-full">
                    <h3>Selected Documents</h3>
            <button onClick={handleRevomeAllFiles} className="px-2 py-1 bg-red-100 text-red-900 rounded-lg">Clear all</button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {files.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt="Preview"
                        className="w-64 h-64 object-cover rounded-lg"
                      />
                      <div>{file.type}</div>
                      <div>{file.name}</div>
                      <button onClick={()=>handleRemoveFile(index)} className="absolute bg-red-100 text-red-900 p-2 top-0 right-2">X</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            
          )} */}

          {files.length > 0 && (
  <div className="absolute bottom-full mb-3 w-full max-w-xl bg-white border border-gray-200 shadow-xl rounded-xl z-50">
    
    {/* Header */}
    <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 rounded-t-xl">
      <h3 className="text-sm font-semibold text-gray-700">
        Selected Files ({files.length})
      </h3>

      <button
        onClick={handleRevomeAllFiles}
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
            <p className="text-gray-400">
              {file.type || "file"}
            </p>
          </div>
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
      </div>
    </div>
  );
};

export default MessageInput;



// import React, { useState, useEffect, useRef } from "react";
// import { useAuth } from "../contexts/AuthProvider";
// import data from "@emoji-mart/data";
// import Picker from "@emoji-mart/react";
// import socket from "../Socket";
// import CustomeApiService from "../services/CustomApiService.jsx";
// import { motion, AnimatePresence } from "framer-motion";
// const MessageInput = ({ roomType, disabled = false }) => {
//   const { POST } = CustomeApiService();
//   const { userData } = useAuth();
//   const [newMsg, setNewMsg] = useState("");
//   const [files, setFiles] = useState([]);
//   const [isDragging, setIsDragging] = useState(false);
//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//   const [uploadProgress, setUploadProgress] = useState({});
//   const [isUploading, setIsUploading] = useState(false);
//   const [isFocused, setIsFocused] = useState(false);
//   const [showFilePreview, setShowFilePreview] = useState(false);
//   const [voiceMode, setVoiceMode] = useState(false);
//   const [isRecording, setIsRecording] = useState(false);
//   const [recordingTime, setRecordingTime] = useState(0);

//   let userName = userData?.user?.name;
//   let userId = userData?.user?.userId;
//   let publicRoomId = userData?.user?.publicRoomId;

//   const TypingTimeOutRef = useRef(null);
//   const isTypingRef = useRef(false);
//   const fileInputRef = useRef(null);
//   const emojiPickerRef = useRef(null);
//   const dropZoneRef = useRef(null);
//   const inputRef = useRef(null);
//   const recordingIntervalRef = useRef(null);

//   // Handle click outside emoji picker
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
//         setShowEmojiPicker(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // Cleanup recording
//   useEffect(() => {
//     return () => {
//       if (recordingIntervalRef.current) {
//         clearInterval(recordingIntervalRef.current);
//       }
//     };
//   }, []);

//   // Drag and drop handlers
//   const handleDragEnter = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     if (!disabled) setIsDragging(true);
//   };

//   const handleDragLeave = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(false);
//   };

//   const handleDragOver = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//   };

//   const handleDrop = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(false);

//     if (disabled) return;

//     const droppedFiles = Array.from(e.dataTransfer.files);
//     if (droppedFiles.length > 0) {
//       handleFilesAdded(droppedFiles);
//     }
//   };

//   const handleFilesAdded = (newFiles) => {
//     setFiles(prev => [...prev, ...newFiles]);
//     setShowFilePreview(true);

//     // Auto scroll to file preview
//     setTimeout(() => {
//       if (dropZoneRef.current) {
//         dropZoneRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
//       }
//     }, 100);
//   };

//   const onKeyPress = (e) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault();
//       onSend();
//     }
//   };

//   const handleTypingMessage = (value) => {
//     setNewMsg(value);

//     if (!isTypingRef.current && value.trim()) {
//       isTypingRef.current = true;
//       socket.emit("typing", {
//         name: userName,
//         roomId: publicRoomId,
//         userId: userId,
//       });

//       clearTimeout(TypingTimeOutRef.current);

//       TypingTimeOutRef.current = setTimeout(() => {
//         isTypingRef.current = false;
//         socket.emit("stop-typing", {
//           name: userName,
//           roomId: publicRoomId,
//           userId: userId,
//         });
//       }, 2000);
//     }
//   };

//   const handleEmojiSelect = (emoji) => {
//     const emojiChar = emoji.native;
//     setNewMsg((prev) => prev + emojiChar);
//     inputRef.current?.focus();
//   };

//   const removeFile = (indexToRemove) => {
//     setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
//     if (files.length === 1) {
//       setShowFilePreview(false);
//     }
//   };

//   const clearAllFiles = () => {
//     setFiles([]);
//     setShowFilePreview(false);
//     if (fileInputRef.current) {
//       fileInputRef.current.value = '';
//     }
//   };

//   const formatFileSize = (bytes) => {
//     if (bytes === 0) return '0 Bytes';
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
//   };

//   const getFileIcon = (fileType) => {
//     if (fileType.startsWith('image/')) {
//       return (
//         <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
//         </svg>
//       );
//     } else if (fileType.startsWith('video/')) {
//       return (
//         <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
//         </svg>
//       );
//     } else if (fileType.startsWith('audio/')) {
//       return (
//         <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
//         </svg>
//       );
//     } else if (fileType.includes('pdf')) {
//       return (
//         <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
//         </svg>
//       );
//     } else {
//       return (
//         <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
//         </svg>
//       );
//     }
//   };

//   const simulateUpload = async (files) => {
//     setIsUploading(true);
//     const progressInterval = setInterval(() => {
//       setUploadProgress(prev => {
//         const newProgress = {};
//         files.forEach((_, index) => {
//           newProgress[index] = Math.min((prev[index] || 0) + 10, 100);
//         });
//         return newProgress;
//       });
//     }, 200);

//     try {
//       const formData = new FormData();
//       files.forEach((file) => {
//         formData.append("files", file);
//       });

//       const res = await POST("upload/messages", {}, {}, formData);

//       clearInterval(progressInterval);
//       setUploadProgress({});
//       setIsUploading(false);

//       return res?.files || [];
//     } catch (err) {
//       clearInterval(progressInterval);
//       setUploadProgress({});
//       setIsUploading(false);
//       console.error("Upload error", err);
//       throw err;
//     }
//   };

//   const onSend = async () => {
//     setShowEmojiPicker(false);
//     setShowFilePreview(false);

//     if ((!newMsg.trim() && files.length === 0) || isUploading) return;

//     let uploadedFiles = [];

//     if (files.length > 0) {
//       try {
//         uploadedFiles = await simulateUpload(files);
//       } catch (err) {
//         // Handle error gracefully
//         return;
//       }
//     }

//     const messageData = {
//       senderId: userId,
//       senderName: userName,
//       message: newMsg,
//       attachments: uploadedFiles,
//       timestamp: new Date().toISOString(),
//     };

//     if (roomType === "public") {
//       messageData.roomId = publicRoomId;
//     }

//     socket.emit("sendMessage", messageData, (res) => {
//       console.log("message sent", messageData);
//     });

//     setNewMsg("");
//     clearAllFiles();
//   };

//   const startRecording = () => {
//     setIsRecording(true);
//     setRecordingTime(0);
//     recordingIntervalRef.current = setInterval(() => {
//       setRecordingTime(prev => prev + 1);
//     }, 1000);
//   };

//   const stopRecording = () => {
//     setIsRecording(false);
//     clearInterval(recordingIntervalRef.current);
//     // Handle audio recording here
//   };

//   const formatRecordingTime = (seconds) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
//   };

//   return (
//     <div
//       className={`bg-white border-t border-gray-200 p-4 transition-all duration-300 relative ${
//         isDragging ? 'bg-gradient-to-r from-blue-50 to-purple-50' : ''
//       }`}
//       onDragEnter={handleDragEnter}
//       onDragLeave={handleDragLeave}
//       onDragOver={handleDragOver}
//       onDrop={handleDrop}
//       ref={dropZoneRef}
//     >
//       {/* Animated background gradient for drag */}
//       {isDragging && !disabled && (
//         <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-400/10 animate-pulse" />
//       )}

//       <div className="relative max-w-6xl mx-auto">
//         {/* Drag & Drop Overlay with Animation */}
//         {isDragging && !disabled && (
//           <motion.div
//             initial={{ opacity: 0, scale: 0.9 }}
//             animate={{ opacity: 1, scale: 1 }}
//             exit={{ opacity: 0, scale: 0.9 }}
//             className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 bg-opacity-20 border-3 border-dashed border-white rounded-2xl z-50 flex items-center justify-center pointer-events-none backdrop-blur-sm"
//           >
//             <div className="bg-white rounded-2xl px-8 py-4 shadow-2xl transform rotate-3">
//               <div className="flex items-center space-x-3">
//                 <svg className="w-8 h-8 text-blue-500 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
//                 </svg>
//                 <p className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
//                   Drop files to upload
//                 </p>
//               </div>
//             </div>
//           </motion.div>
//         )}

//         {/* File Preview Section with Animation */}
//         <AnimatePresence>
//           {showFilePreview && files.length > 0 && (
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: 20 }}
//               className="absolute bottom-full left-0 right-0 mb-4 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
//             >
//               {/* Preview Header */}
//               <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex items-center justify-between">
//                 <div className="flex items-center space-x-3">
//                   <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
//                     <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
//                     </svg>
//                   </div>
//                   <div>
//                     <h3 className="font-semibold text-gray-800">File Attachments</h3>
//                     <p className="text-sm text-gray-500">
//                       {files.length} {files.length === 1 ? 'file' : 'files'} selected • Total size: {formatFileSize(files.reduce((acc, file) => acc + file.size, 0))}
//                     </p>
//                   </div>
//                 </div>
//                 <button
//                   onClick={clearAllFiles}
//                   className="px-4 py-2 text-sm text-red-500 hover:text-red-600 font-medium hover:bg-red-50 rounded-xl transition-colors"
//                 >
//                   Clear all
//                 </button>
//               </div>

//               {/* Preview Grid */}
//               <div className="max-h-80 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
//                 {files.map((file, index) => (
//                   <motion.div
//                     key={index}
//                     initial={{ opacity: 0, scale: 0.8 }}
//                     animate={{ opacity: 1, scale: 1 }}
//                     transition={{ delay: index * 0.05 }}
//                     className="relative group"
//                   >
//                     {file.type.startsWith('image/') ? (
//                       <div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-square">
//                         <img
//                           src={URL.createObjectURL(file)}
//                           alt={file.name}
//                           className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
//                         />
//                         <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

//                         {/* Image overlay info */}
//                         <div className="absolute bottom-0 left-0 right-0 p-2 transform translate-y-full group-hover:translate-y-0 transition-transform">
//                           <p className="text-xs text-white font-medium truncate">{file.name}</p>
//                           <p className="text-xs text-gray-300">{formatFileSize(file.size)}</p>
//                         </div>
//                       </div>
//                     ) : (
//                       <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-200 group-hover:border-blue-300 transition-all group-hover:shadow-lg">
//                         <div className="flex flex-col items-center text-center">
//                           <div className="w-16 h-16 mb-3 flex items-center justify-center">
//                             {getFileIcon(file.type)}
//                           </div>
//                           <p className="text-sm font-medium text-gray-700 truncate w-full">{file.name}</p>
//                           <p className="text-xs text-gray-500 mt-1">{formatFileSize(file.size)}</p>
//                         </div>
//                       </div>
//                     )}

//                     {/* Remove button */}
//                     <button
//                       onClick={() => removeFile(index)}
//                       className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:scale-110 flex items-center justify-center"
//                     >
//                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                       </svg>
//                     </button>

//                     {/* Upload progress */}
//                     {uploadProgress[index] !== undefined && uploadProgress[index] < 100 && (
//                       <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-full overflow-hidden">
//                         <motion.div
//                           initial={{ width: 0 }}
//                           animate={{ width: `${uploadProgress[index]}%` }}
//                           className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
//                         />
//                       </div>
//                     )}
//                   </motion.div>
//                 ))}
//               </div>
//             </motion.div>
//           )}
//         </AnimatePresence>

//         {/* Emoji Picker with Animation */}
//         <AnimatePresence>
//           {showEmojiPicker && (
//             <motion.div
//               ref={emojiPickerRef}
//               initial={{ opacity: 0, y: 20, scale: 0.95 }}
//               animate={{ opacity: 1, y: 0, scale: 1 }}
//               exit={{ opacity: 0, y: 20, scale: 0.95 }}
//               className="absolute bottom-full mb-4 z-[9999]"
//             >
//               <div className="relative">
//                 <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-t border-l border-gray-200" />
//                 <Picker
//                   data={data}
//                   onEmojiSelect={handleEmojiSelect}
//                   theme="light"
//                   previewPosition="none"
//                   skinTonePosition="none"
//                   className="shadow-2xl"
//                 />
//               </div>
//             </motion.div>
//           )}
//         </AnimatePresence>

//         {/* Voice Recording Indicator */}
//         <AnimatePresence>
//           {isRecording && (
//             <motion.div
//               initial={{ opacity: 0, y: -20 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -20 }}
//               className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center space-x-4"
//             >
//               <div className="flex items-center space-x-2">
//                 <span className="relative flex h-3 w-3">
//                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
//                   <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
//                 </span>
//                 <span className="font-medium">Recording</span>
//               </div>
//               <span className="font-mono">{formatRecordingTime(recordingTime)}</span>
//               <button
//                 onClick={stopRecording}
//                 className="ml-2 w-8 h-8 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors flex items-center justify-center"
//               >
//                 <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
//                 </svg>
//               </button>
//             </motion.div>
//           )}
//         </AnimatePresence>

//         {/* Main Input Section */}
//         <div className={`flex items-center space-x-2 transition-all duration-300 ${isFocused ? 'transform -translate-y-1' : ''}`}>
//           {/* Action Buttons Group */}
//           <div className="flex items-center bg-gray-50 rounded-2xl p-1">
//             {/* File Upload Button */}
//             <motion.label
//               whileHover={{ scale: 1.05 }}
//               whileTap={{ scale: 0.95 }}
//               htmlFor="file-upload"
//               className={`p-3 text-gray-500 hover:text-blue-600 rounded-xl transition-all cursor-pointer relative group ${
//                 disabled ? 'opacity-50 cursor-not-allowed' : ''
//               }`}
//             >
//               <input
//                 type="file"
//                 multiple
//                 onChange={(e) => handleFilesAdded(Array.from(e.target.files))}
//                 className="hidden"
//                 id="file-upload"
//                 ref={fileInputRef}
//                 disabled={disabled}
//                 accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
//               />
//               <svg
//                 className="w-6 h-6"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
//                 />
//               </svg>

//               {/* Tooltip */}
//               <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
//                 Attach files
//               </div>
//             </motion.label>

//             {/* Emoji Button */}
//             <motion.button
//               whileHover={{ scale: 1.05 }}
//               whileTap={{ scale: 0.95 }}
//               onClick={() => setShowEmojiPicker(!showEmojiPicker)}
//               disabled={disabled}
//               className={`p-3 text-gray-500 hover:text-yellow-500 rounded-xl transition-all relative group ${
//                 disabled ? 'opacity-50 cursor-not-allowed' : ''
//               }`}
//             >
//               <svg
//                 className="w-6 h-6"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
//                 />
//               </svg>

//               {/* Tooltip */}
//               <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity">
//                 Add emoji
//               </div>
//             </motion.button>

//             {/* Voice/Text Toggle */}
//             <motion.button
//               whileHover={{ scale: 1.05 }}
//               whileTap={{ scale: 0.95 }}
//               onClick={() => setVoiceMode(!voiceMode)}
//               disabled={disabled}
//               className={`p-3 rounded-xl transition-all relative group ${
//                 voiceMode
//                   ? 'text-purple-500 bg-purple-50'
//                   : 'text-gray-500 hover:text-purple-500'
//               } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
//             >
//               {voiceMode ? (
//                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
//                 </svg>
//               ) : (
//                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
//                 </svg>
//               )}

//               {/* Tooltip */}
//               <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
//                 {voiceMode ? 'Switch to text' : 'Voice message'}
//               </div>
//             </motion.button>
//           </div>

//           {/* Message Input */}
//           <div className="flex-1 relative">
//             {voiceMode ? (
//               <div className="relative">
//                 <input
//                   type="text"
//                   placeholder="Type or click mic to record..."
//                   value={newMsg}
//                   onChange={(e) => handleTypingMessage(e.target.value)}
//                   onKeyPress={onKeyPress}
//                   onFocus={() => setIsFocused(true)}
//                   onBlur={() => setIsFocused(false)}
//                   disabled={disabled}
//                   className={`w-full px-4 py-3 pl-12 bg-gray-50 border text-black rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all ${
//                     disabled
//                       ? 'opacity-50 cursor-not-allowed bg-gray-100'
//                       : 'hover:bg-white focus:bg-white'
//                   }`}
//                   ref={inputRef}
//                 />
//                 <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
//                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
//                   </svg>
//                 </div>

//                 {/* Microphone Button */}
//                 {!isRecording ? (
//                   <motion.button
//                     whileHover={{ scale: 1.1 }}
//                     whileTap={{ scale: 0.9 }}
//                     onClick={startRecording}
//                     className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-purple-500 hover:bg-purple-50 rounded-xl transition-all"
//                   >
//                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
//                     </svg>
//                   </motion.button>
//                 ) : (
//                   <motion.button
//                     animate={{ scale: [1, 1.2, 1] }}
//                     transition={{ repeat: Infinity, duration: 1.5 }}
//                     onClick={stopRecording}
//                     className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-red-500 hover:bg-red-50 rounded-xl"
//                   >
//                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
//                     </svg>
//                   </motion.button>
//                 )}
//               </div>
//             ) : (
//               <input
//                 type="text"
//                 placeholder={disabled ? "Select a chat to start messaging..." : "Type your message..."}
//                 value={newMsg}
//                 onChange={(e) => handleTypingMessage(e.target.value)}
//                 onKeyPress={onKeyPress}
//                 onFocus={() => setIsFocused(true)}
//                 onBlur={() => setIsFocused(false)}
//                 disabled={disabled}
//                 className={`w-full px-4 py-3 pl-12 bg-gray-50 border text-black rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all ${
//                   disabled
//                     ? 'opacity-50 cursor-not-allowed bg-gray-100'
//                     : 'hover:bg-white focus:bg-white'
//                 }`}
//                 ref={inputRef}
//               />
//             )}
//             <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
//               <svg
//                 className="w-5 h-5"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
//                 />
//               </svg>
//             </div>

//             {/* Character count */}
//             {newMsg.length > 0 && (
//               <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 bg-white px-2 py-1 rounded-full">
//                 {newMsg.length}
//               </div>
//             )}
//           </div>

//           {/* Send Button with Animation */}
//           <motion.button
//             whileHover={ (newMsg.trim() || files.length > 0) && !disabled ? { scale: 1.05 } : {} }
//             whileTap={ (newMsg.trim() || files.length > 0) && !disabled ? { scale: 0.95 } : {} }
//             onClick={onSend}
//             disabled={(!newMsg.trim() && files.length === 0) || disabled || isUploading}
//             className={`px-6 py-3 rounded-2xl font-medium transition-all duration-300 transform relative overflow-hidden group ${
//               (newMsg.trim() || files.length > 0) && !disabled && !isUploading
//                 ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl"
//                 : isUploading
//                 ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white cursor-wait"
//                 : "bg-gray-200 text-gray-400 cursor-not-allowed"
//             }`}
//           >
//             <span className="flex items-center space-x-2 relative z-10">
//               {isUploading ? (
//                 <>
//                   <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                   </svg>
//                   <span>Uploading...</span>
//                 </>
//               ) : (
//                 <>
//                   <span>Send</span>
//                   <svg
//                     className="w-5 h-5 group-hover:translate-x-1 transition-transform"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
//                     />
//                   </svg>
//                 </>
//               )}
//             </span>

//             {/* Shine effect */}
//             {(newMsg.trim() || files.length > 0) && !disabled && !isUploading && (
//               <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
//             )}
//           </motion.button>
//         </div>

//         {/* Smart Input Features */}
//         {!disabled && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             className="mt-3 flex items-center justify-between text-xs"
//           >
//             <div className="flex items-center space-x-4 text-gray-400">
//               <div className="flex items-center space-x-1">
//                 <kbd className="px-2 py-1 bg-gray-100 rounded-md text-gray-600 font-mono text-xs">⏎</kbd>
//                 <span>to send</span>
//               </div>
//               <div className="flex items-center space-x-1">
//                 <kbd className="px-2 py-1 bg-gray-100 rounded-md text-gray-600 font-mono text-xs">⇧</kbd>
//                 <span>+</span>
//                 <kbd className="px-2 py-1 bg-gray-100 rounded-md text-gray-600 font-mono text-xs">⏎</kbd>
//                 <span>new line</span>
//               </div>
//             </div>

//             {/* Quick actions */}
//             <div className="flex items-center space-x-2">
//               <button className="px-3 py-1 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-500 transition-colors flex items-center space-x-1">
//                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
//                 </svg>
//                 <span>Quick reply</span>
//               </button>
//               <button className="px-3 py-1 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-green-500 transition-colors flex items-center space-x-1">
//                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
//                 </svg>
//                 <span>AI suggest</span>
//               </button>
//             </div>
//           </motion.div>
//         )}
//       </div>

//       {/* Upload progress bar */}
//       {isUploading && (
//         <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
//           <motion.div
//             initial={{ width: 0 }}
//             animate={{ width: '100%' }}
//             transition={{ duration: 2 }}
//             className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
//           />
//         </div>
//       )}
//     </div>
//   );
// };

// // Helper component for animations (if you don't have framer-motion, remove these)
// // const motion = {
// //   div: ({ children, ...props }) => <div {...props}>{children}</div>,
// //   button: ({ children, ...props }) => <button {...props}>{children}</button>,
// //   label: ({ children, ...props }) => <label {...props}>{children}</label>
// // };

// // const AnimatePresence = ({ children }) => <>{children}</>;

// export default MessageInput;
