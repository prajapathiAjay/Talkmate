import { toast } from "sonner";
import React, { useState, useRef, useEffect } from "react";

import socket from "../Socket.jsx";
import {
  Settings,
  LogOut,
  Users,
  Shield,
  MoreHorizontal,
  Bell,
  Search,
  ChevronDown,

} from "lucide-react";
import { useNavigate } from "react-router-dom";
import CustomApiService from "../services/CustomApiService";
import { useAuth } from "../contexts/AuthProvider.jsx";
import Modal from "../components/Modal.jsx";
const ChatHeader = ({ handleShowOnlineUsers }) => {
  const { GET ,POST} = CustomApiService();
  const { userData,login,logout } = useAuth();

  const [openMenu, setOpenMenu] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const menuRef = useRef(null);

const navigate=useNavigate()
  const logOut = async () => {
    try {
      const response = await POST("user/logout");
      console.log("Logout response:", response);
      if (response.success) {
        toast.success("You have left the room.");
        socket.disconnect();
        localStorage.removeItem("token");
        logout();
        // localStorage.removeItem("userData");
        navigate("/signIn", { replace: true });
      } else {
        toast.error(response.message );
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

  return (<>
    <header className="sticky top-0  w-full px-4 pt-4 pb-2 bg-transparent pointer-events-none">
      <div className="max-w-7xl mx-auto h-16 pointer-events-auto bg-white/80 backdrop-blur-2xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl flex items-center justify-between px-4 ring-1 ring-gray-900/5">
        {/* LEFT: Room Identity */}
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-10 h-10 bg-gradient-to-tr from-violet-600 to-indigo-500 rounded-[12px] flex items-center justify-center text-white shadow-inner transition-transform duration-500 group-hover:scale-105 group-hover:rotate-6">
              <span className="font-black text-lg">
               
                {"A"}
              </span>
            </div>
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 border-[2.5px] border-white rounded-full shadow-sm" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-[15px] font-bold text-gray-900 tracking-tight leading-none">
               {"public Roommm"}
              </h1>
              <span className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded-md border border-gray-200/50">
                <Shield className="w-2.5 h-2.5 text-gray-500" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                  Public
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex -space-x-1.5 overflow-hidden">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="inline-block h-5 w-5 rounded-full ring-2  ring-white bg-gray-200"
                  >
                    <img
                      src={`https://i.pravatar.cc/150?img=${i + 10}`}
                      alt={`User ${i}`}
                      className="h-full w-full object-cover rounded-full"
                    />
                  </div>
                ))}
              </div>
              <p className="text-[11px] font-medium text-gray-400">
                <span className="text-indigo-600 font-bold">12 active</span>{" "}
                contributors
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT: Global Actions */}
        <div className="flex items-center gap-1.5">
          {/* Secondary Action: Search */}
          <button
            onClick={() => {
              toast.info("Search functionality coming soon!");
            }}
            className="hidden sm:flex p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <Search className="w-4.5 h-4.5" />
          </button>

          {/* Secondary Action: Notifications */}
          {/* <button className="hidden sm:flex p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">
            <Bell className="w-4.5 h-4.5" />
          </button> */}

          <div className="h-4 w-[1px] bg-gray-200 mx-1 hidden sm:block" />

          {/* Mobile Users Toggle */}
          <button
            onClick={handleShowOnlineUsers}
            className="md:hidden flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl transition-all shadow-md shadow-indigo-100 active:scale-95"
          >
            <Users className="w-4 h-4" />
            <span className="text-xs font-bold">Members</span>
          </button>

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpenMenu(!openMenu)}
              className={`group flex items-center gap-1 p-1.5 pl-2 rounded-xl transition-all border ${
                openMenu
                  ? "bg-white border-gray-300 shadow-sm"
                  : "bg-gray-50/50 border-transparent hover:border-gray-200 hover:bg-white"
              }`}
            >
              <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Settings className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-300 ${openMenu ? "rotate-180" : ""}`}
              />
            </button>

            {/* Menu Dropdown */}
            {openMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200/60 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                <div className="px-4 py-2 border-b border-gray-50 mb-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Manage
                  </p>
                </div>
                <button className="w-full flex items-center gap-3 px-3.5 py-2 text-sm text-gray-600 hover:bg-indigo-50/50 hover:text-indigo-600 transition-colors mx-auto w-[94%] rounded-lg">
                  <Settings className="w-4 h-4" />
                  Room Settings
                </button>
                <button
                  onClick={() => logOut()}
                  className="w-full flex items-center gap-3 px-3.5 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors mx-auto w-[94%] rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                  Leave Room
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
    <Modal
  isOpen={openProfile}
  onClose={() => setOpenProfile(false)}
  title="Edit Profile"
  width="max-w-2xl"
></Modal>
    
    </>
  );
};

export default ChatHeader;
