

import React, { useState, useEffect } from "react";
import { 
  Users, Circle, Search, MoreVertical, 
  MessageCircle, Wifi, WifiOff, Clock,
  Filter, X, Star, Crown, Zap,
  ChevronRight, Activity, Coffee
} from "lucide-react";
import CustomApiService from "../services/CustomApiService";

const OnlineUsers = ({ showOnlineUsers, onClose }) => {
  const { GET } = CustomApiService();
  const [AllUSers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  const getAllUsers = async () => {
    try {
      setIsLoading(true);
      const res = await GET("user/allUsers", {}, {}, {});
      if (res?.success) {
        const allUsersData = res?.data;
        setAllUsers(allUsersData);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getAllUsers();
  }, []);

  const filteredUsers = AllUSers.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === "all" || user.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "online":
        return "bg-gradient-to-r from-green-400 to-emerald-500";
      case "away":
        return "bg-gradient-to-r from-yellow-400 to-amber-500";
      default:
        return "bg-gradient-to-r from-gray-400 to-gray-500";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "online":
        return <Zap className="w-3 h-3 text-green-500" />;
      case "away":
        return <Coffee className="w-3 h-3 text-yellow-500" />;
      default:
        return <WifiOff className="w-3 h-3 text-gray-400" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "online":
        return "Active now";
      case "away":
        return "Away";
      default:
        return "Offline";
    }
  };

  const getBadgeColor = (status) => {
    switch (status) {
      case "online":
        return "bg-green-100 text-green-700 border-green-200";
      case "away":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const onlineCount = AllUSers.filter((u) => u.status === "online").length;
  const awayCount = AllUSers.filter((u) => u.status === "away").length;
  const offlineCount = AllUSers.filter((u) => u.status === "offline").length;

  // Featured users (for demo - you can modify based on your data)
  const featuredUsers = AllUSers.filter(u => u.isFeatured || u.status === "online").slice(0, 3);

  return (
    <div
      className={`fixed inset-y-0 right-0 
        w-full md:w-96
        transform ${showOnlineUsers ? "translate-x-0" : "translate-x-full"}
        transition-all duration-400 ease-out
        bg-gradient-to-br from-indigo-50 via-white to-purple-50
        shadow-2xl
        md:relative md:translate-x-0
        flex flex-col
        border-l border-indigo-100
      `}
    >
      {/* Decorative Elements */}
      {/* <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-pink-200/20 to-orange-200/20 rounded-full blur-3xl -z-10"></div> */}
      
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl shadow-lg border border-white/30">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                Community Hub
                <Crown className="w-5 h-5 text-yellow-300" />
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-white/80" />
                  <span className="text-white/90 text-sm font-medium">
                    {onlineCount} active now
                  </span>
                </div>
                <span className="text-white/40">•</span>
                <span className="text-white/70 text-sm">{AllUSers.length} total</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-white/20 rounded-xl transition-all backdrop-blur-sm border border-white/20">
              <Star className="w-5 h-5 text-white" />
            </button>
            {onClose && (
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-xl transition-all md:hidden border border-white/20"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            )}
          </div>
        </div>

        {/* Featured Users Strip */}
        {featuredUsers.length > 0 && (
          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {featuredUsers.map((user, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full pl-1 pr-3 py-1 border border-white/20">
                <div className="relative">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full border border-white" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold">
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${user.status === 'online' ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                </div>
                <span className="text-xs text-white font-medium whitespace-nowrap">{user.name}</span>
              </div>
            ))}
            <div className="text-xs text-white/60 whitespace-nowrap">+{AllUSers.length - featuredUsers.length} more</div>
          </div>
        )}
      </div>

      {/* Search Section */}
      <div className="p-5">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search amazing people..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border-2 border-gray-100 text-gray-800 placeholder-gray-400 rounded-2xl pl-10 pr-12 py-3.5 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm("")}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => setSelectedFilter("all")}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all transform hover:scale-105 ${
              selectedFilter === "all"
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-200"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 shadow-sm"
            }`}
          >
            All
            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
              selectedFilter === "all" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
            }`}>
              {AllUSers.length}
            </span>
          </button>
          <button
            onClick={() => setSelectedFilter("online")}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all transform hover:scale-105 flex items-center gap-1.5 ${
              selectedFilter === "online"
                ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-200"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 shadow-sm"
            }`}
          >
            <Zap className="w-4 h-4" />
            Online
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
              selectedFilter === "online" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
            }`}>
              {onlineCount}
            </span>
          </button>
          <button
            onClick={() => setSelectedFilter("away")}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all transform hover:scale-105 flex items-center gap-1.5 ${
              selectedFilter === "away"
                ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg shadow-yellow-200"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 shadow-sm"
            }`}
          >
            <Coffee className="w-4 h-4" />
            Away
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
              selectedFilter === "away" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
            }`}>
              {awayCount}
            </span>
          </button>
        </div>
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-y-auto px-5">
        <div className="space-y-2 pb-4">
          {isLoading ? (
            // Animated loading skeletons
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-gray-200 to-gray-300"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded"></div>
                  <div className="h-3 w-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded"></div>
                </div>
              </div>
            ))
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((user, index) => (
              <div
                key={user.id || index}
                className="group relative bg-white rounded-2xl p-4 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-blue-100 cursor-pointer animate-fadeIn"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center space-x-4">
                  {/* Avatar with fancy ring */}
                  <div className="relative">
                    <div className={`absolute inset-0 ${getStatusColor(user.status)} rounded-2xl blur opacity-50 group-hover:opacity-70 transition-opacity`}></div>
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="relative w-14 h-14 rounded-2xl object-cover border-3 border-white shadow-lg"
                      />
                    ) : (
                      <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${user.status === 'online' ? 'from-green-400 to-blue-500' : 'from-gray-400 to-gray-500'} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(user.status)} rounded-full border-3 border-white shadow-lg`}></div>
                  </div>

                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                        {user.name}
                      </h3>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getBadgeColor(user.status)}`}>
                        {getStatusIcon(user.status)}
                        <span>{user.status}</span>
                      </div>
                    </div>
                    
                    {/* Activity or last seen */}
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      {user.status === 'online' ? (
                        <>
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                          <span>Typing...</span>
                        </>
                      ) : (
                        user.lastActive || 'Last seen recently'
                      )}
                    </p>

                    {/* Tags/Metadata */}
                    <div className="flex items-center gap-2 mt-2">
                      {user.isPro && (
                        <span className="px-2 py-0.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-600 rounded-full text-xs font-medium border border-purple-200">
                          ⚡ Pro
                        </span>
                      )}
                      {user.isVerified && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs font-medium border border-blue-200">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Button with animation */}
                  <button className="absolute right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-110">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                  </button>
                </div>

                {/* Progress/Activity bar (optional) */}
                {user.status === 'online' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-blue-500 rounded-b-2xl animate-slide"></div>
                )}
              </div>
            ))
          ) : (
            // Empty state with illustration
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                <div className="relative bg-white rounded-full p-6 shadow-xl border-4 border-blue-50">
                  <Users className="w-16 h-16 text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No users found</h3>
              <p className="text-gray-500 max-w-[220px]">
                {searchTerm ? "No matches for your search" : "Be the first to join the community!"}
              </p>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="mt-4 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer with stats */}
      <div className="bg-white border-t border-gray-100 px-5 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-gradient-to-r from-green-400 to-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">{onlineCount} online</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">{awayCount} away</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">{offlineCount} offline</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <span className="font-bold text-blue-600">{filteredUsers.length}</span>
            <span className="text-gray-400">/ {AllUSers.length}</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .animate-slide {
          animation: slide 2s infinite;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        /* Custom Scrollbar */
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 20px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #60a5fa, #a78bfa);
          border-radius: 20px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
        }
      `}</style>
    </div>
  );
};

export default OnlineUsers;