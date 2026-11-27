import { toast } from "sonner";
import { useState, useRef, useEffect } from "react";
import publicLogo from "../assets/logo/publiclogo.webp";
import socket from "../Socket.jsx";
import {
  Settings,
  LogOut,
  ArrowLeftRightIcon,
  ChevronDown,
  BellOff,
} from "lucide-react";
import SettingsModal from "../components/SettingsModal.jsx";
import { useNavigate } from "react-router-dom";
import { FormatLastSeen } from "../utils/FormatLastSeen.js";
import CustomApiService from "../services/CustomApiService";
import { useAuth } from "../contexts/AuthContext.js";
import { avatarGradient } from "../utils/avatarColor.js";

const ChatHeader = () => {
  const { POST } = CustomApiService();
  const {
    userData,
    logout,
    roomType,
    currentPartner,
    handleRoomTypeChange,
    handleChatRoomIdChange,
    unreadCounts,
    chatRoomId,
    isMuted,
  } = useAuth();
  const [showSettings, setShowSettings] = useState(false);

  const publicUnread = unreadCounts?.[userData?.user?.publicRoomId] || 0;

  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef(null);

  const navigate = useNavigate();

  const logOut = async () => {
    try {
      const response = await POST("user/logout");
      if (response.success) {
        toast.success("You have left the room.");
        socket.disconnect();
        logout();
        navigate("/signIn", { replace: true });
      } else {
        toast.error(response.message);
      }
    } catch (err) {
      toast.error(err.message || "An error occurred while leaving the room.");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const switchPublicRoom = () => {
    handleRoomTypeChange("public");
    handleChatRoomIdChange(userData?.user?.publicRoomId);
  };

  return (
    <>
      <header className="sticky top-0 z-20 w-full px-2 pt-2 pb-1 sm:px-4 sm:pt-4 sm:pb-2 bg-transparent pointer-events-none">
        <div className="max-w-7xl mx-auto h-14 sm:h-16 pointer-events-auto surface rounded-2xl flex items-center justify-between gap-2 px-3 sm:px-4">
          {/* LEFT: Room Identity */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="relative group shrink-0">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-[12px] flex items-center justify-center text-white shadow-lg shadow-violet-500/30 transition-transform duration-500 group-hover:scale-105 group-hover:rotate-6 ${roomType === "public" ? "brand-bg" : `bg-gradient-to-br ${avatarGradient(currentPartner?.name)}`}`}>
                <span className="font-black text-lg">
                  {roomType === "public" ? (
                    <img
                      src={publicLogo}
                      alt="Public Logo"
                      className="w-7 h-7 sm:w-8 sm:h-8 object-cover"
                    />
                  ) : (
                    <div>{currentPartner?.name?.charAt(0)?.toUpperCase()}</div>
                  )}
                </span>
              </div>
              {(roomType === "public" || currentPartner?.isOnline) && (
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-[2.5px] border-white rounded-full" />
              )}
            </div>

            <div className="flex flex-col min-w-0">
              <h2 className="flex items-center gap-1.5 text-base sm:text-lg font-semibold leading-tight text-gray-900 min-w-0">
                <span className="truncate">{roomType === "public" ? "Public Room" : currentPartner?.name}</span>
                {isMuted(chatRoomId) && (
                  <BellOff className="w-3.5 h-3.5 shrink-0 text-gray-400" aria-label="Muted" />
                )}
              </h2>

              <p
                className={`text-xs sm:text-sm truncate ${
                  roomType === "public"
                    ? "text-gray-500"
                    : currentPartner?.isOnline
                      ? "text-emerald-600"
                      : "text-gray-500"
                }`}
              >
                {roomType === "public"
                  ? "Open for everyone"
                  : currentPartner?.isOnline
                    ? "Online"
                    : `${FormatLastSeen(currentPartner?.lastSeen)}`}
              </p>
            </div>
          </div>

          {/* RIGHT: Global Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Switch back to public room */}
            <button
              onClick={switchPublicRoom}
              title="Back to public chat"
              className={`${roomType === "public" ? "hidden" : "flex"} relative items-center gap-2 btn-primary p-2 sm:px-3 sm:py-1.5 rounded-xl`}
            >
              <ArrowLeftRightIcon className="w-4 h-4" />
              <span className="sr-only sm:not-sr-only text-xs font-bold">public chat</span>
              {publicUnread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold leading-none ring-2 ring-white animate-[pop_0.25s_ease-out]">
                  {publicUnread > 99 ? "99+" : publicUnread}
                </span>
              )}
            </button>

            {/* User Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setOpenMenu(!openMenu)}
                className={`group flex items-center gap-1 p-1.5 pl-2 rounded-xl transition-all border ${
                  openMenu
                    ? "bg-white/70 border-white/80"
                    : "border-transparent hover:bg-white/50 hover:border-white/70"
                }`}
              >
                <div className="w-6 h-6 rounded-lg bg-violet-100/80 flex items-center justify-center">
                  <Settings className="w-3.5 h-3.5 text-violet-600" />
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-300 ${openMenu ? "rotate-180" : ""}`}
                />
              </button>

              {/* Menu Dropdown */}
              {openMenu && (
                <div className="absolute right-0 mt-2 w-52 surface-raised rounded-2xl shadow-2xl shadow-gray-900/10 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                  <div className="px-4 py-2 border-b border-gray-200/60 mb-1">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      Manage
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setOpenMenu(false);
                      setShowSettings(true);
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors mx-auto w-[94%] rounded-lg"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <button
                    onClick={() => logOut()}
                    className="w-full flex items-center gap-3 px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors mx-auto w-[94%] rounded-lg"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
};

export default ChatHeader;
