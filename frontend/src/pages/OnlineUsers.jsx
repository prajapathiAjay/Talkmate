import React, { useState, useEffect } from "react";
import { Users, Circle, Search, MoreVertical } from "lucide-react";
import CustomApiService from "../services/CustomApiService";

const OnlineUsers = ({ showOnlineUsers }) => {
  const { GET } = CustomApiService();
  const [AllUSers, setAllUsers] = useState([]);

  const getAllUsers = async () => {
    try {
      const res = await GET("user/allUsers", {}, {}, {});
      if (res?.success) {
        const allUsersData = res?.data;
        setAllUsers(allUsersData);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getAllUsers();
  }, []);

  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = AllUSers.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    // <div className={`fixed inset-y-0 right-0  transform ${showOnlineUsers ? 'translate-x-0' : 'translate-x-full'}   bg-linear-to-br from-gray-900 to-gray-400 p-6 md:w-80 md:relative md:top-0 md:left-0 `}>

    <div
      className={`fixed inset-y-0 right-0 
  w-full md:w-80
  transform ${showOnlineUsers ? "translate-x-0" : "translate-x-full"}
  transition-transform duration-300 ease-in-out
  bg-linear-to-br from-gray-900 to-gray-400
  p-6
  md:relative md:translate-x-0
`}
    >
      <div className="w-auto mx-auto">
        {/* Main Card */}
        <div className="bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-700">
          {/* Header */}
          <div className="bg-linear-to-r from-blue-600 to-blue-700 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Online Users</h2>
                  <p className="text-blue-100 text-sm">
                    {AllUSers.filter((u) => u.status === "online").length} users
                    online
                  </p>
                </div>
              </div>
              <button className="text-white/80 hover:text-white transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600"
              />
            </div>
          </div>

          {/* Users List */}
          <div className="p-4">
            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, index) => (
                  <div
                    key={index}
                    className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700/50 transition-all duration-200 cursor-pointer border border-transparent hover:border-gray-600"
                  >
                    {/* Avatar with Status */}
                    <div className="relative shrink-0">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-600 group-hover:border-blue-400 transition-colors"
                      />
                      <Circle
                        className={`absolute bottom-0 right-0 w-3.5 h-3.5 ${getStatusColor(
                          user.status,
                        )} rounded-full border-2 border-gray-800`}
                      />
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-white font-medium truncate">
                          {user.name}
                        </h3>
                        <span className="text-xs text-gray-400">
                          {user.lastActive}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 capitalize">
                        {user.status}
                      </p>
                    </div>

                    {/* Message Button */}
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-full">
                      Message
                    </button>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="bg-gray-700/50 rounded-full p-4 mb-3">
                    <Users className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-gray-400 text-center">
                    No online users at the moment
                  </p>
                  <p className="text-gray-500 text-sm text-center mt-1">
                    Check back later
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Stats */}
          <div className="bg-gray-700/30 px-4 py-3 border-t border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Circle className="w-2.5 h-2.5 text-green-500 fill-current" />
                  <span className="text-gray-300">
                    {AllUSers.filter((u) => u.status === "online").length}{" "}
                    Online
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Circle className="w-2.5 h-2.5 text-yellow-500 fill-current" />
                  <span className="text-gray-300">
                    {AllUSers.filter((u) => u.status === "away").length} Away
                  </span>
                </div>
              </div>
              <span className="text-gray-400">Total: {AllUSers.length}</span>
            </div>
          </div>
        </div>

        {/* Example Controls (for demo) */}
        {/* <div className="mt-4 flex justify-center space-x-2">
          <button
            onClick={() => setAllUsers([])}
            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm transition-colors"
          >
            Clear Users
          </button>
          <button
            onClick={() =>
              setAllUsers([
                {
                  id: 1,
                  name: "Alex Johnson",
                  avatar: "https://i.pravatar.cc/150?img=1",
                  status: "online",
                  lastActive: "now",
                },
                {
                  id: 2,
                  name: "Sarah Williams",
                  avatar: "https://i.pravatar.cc/150?img=2",
                  status: "online",
                  lastActive: "now",
                },
              ])
            }
            className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-sm transition-colors"
          >
            Reset Users
          </button>
        </div> */}
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #374151;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default OnlineUsers;
