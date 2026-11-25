import { useState, useEffect, useRef } from "react";
import {
  Users,
  X,
  ChevronLeft,
  UserPlus2,
  Users2Icon,
  Handshake,
  Search,
  MessageCircle,
} from "lucide-react";
import { FormatLastSeen } from "../utils/FormatLastSeen.js";
import CustomApiService from "../services/CustomApiService";
import socket from "../Socket.jsx";
import { useAuth } from "../contexts/AuthProvider.jsx";
import { toast } from "sonner";
import { avatarGradient } from "../utils/avatarColor.js";

const OnlineUsers = ({ showOnlineUsers, handleShowOnlineUsers, closeOnlineUsers }) => {
  const { GET, POST } = CustomApiService();
  const [allUsers, setAllUsers] = useState([]);
  const {
    userData,
    roomType,
    handleChatRoomIdChange,
    handleRoomTypeChange,
    handlePartnerChange,
    unreadCounts,
  } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [friendRoom, setFriendRoom] = useState([]);

  const getAllUsers = async () => {
    try {
      const params = {};
      if (selectedFilter !== "all") {
        params.isOnline = selectedFilter;
      }
      if (searchTerm.trim() !== "") {
        params.name = searchTerm;
      }
      setIsLoading(true);
      const res = await GET("user/allUsers", params, {}, {});
      if (res?.success) {
        // The signed-in user shouldn't appear in their own list
        const allUsersData = res?.data?.filter(
          (user) => user._id !== userData?.user?.userId,
        );
        setAllUsers(allUsersData);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = (response) => {
    if (response.success && response?.data?._id !== userData?.user?.userId) {
      const newJoinedUsers = response?.data;
      setAllUsers((prevUsers) => {
        const existingUser = prevUsers.some(
          (user) => user._id === newJoinedUsers._id,
        );
        if (existingUser) {
          return prevUsers.map((user) =>
            user._id === newJoinedUsers._id ? newJoinedUsers : user,
          );
        } else {
          return [newJoinedUsers, ...prevUsers];
        }
      });
    }
  };

  // Add as friend (also creates the private room)
  const handleAddFriend = async (friendId) => {
    try {
      const payload = {
        friendId,
        userId: userData?.user?.userId,
      };

      const roomPayload = {
        type: "private",
        participants: [userData?.user?.userId, friendId],
      };

      const [roomResponse, friendResponse] = await Promise.all([
        POST("room/createRoom", {}, {}, roomPayload),
        POST("friend/add", {}, {}, payload),
      ]);

      if (friendResponse?.success) {
        toast.success(friendResponse.message);
      }

      if (roomResponse && friendResponse) {
        getAllUsers();
        getPrivateRoom();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const getPrivateRoom = async () => {
    try {
      const params = {
        type: "private",
        participants: [userData?.user?.userId],
      };
      if (searchTerm.trim() !== "") {
        params.name = searchTerm;
      }

      const response = await GET("room/private", params, {}, {});
      if (response.success) {
        setFriendRoom(
          response?.data.map((friend) => ({
            ...friend,
            isCurrent: false,
          })),
        );
      }
    } catch {
      // Errors are intentionally ignored here
    }
  };

  useEffect(() => {
    socket.on("user-status-changed", handleStatusChange);
    return () => socket.off("user-status-changed", handleStatusChange);
  }, []);

  useEffect(() => {
    if (roomType === "private") {
      return;
    }
    handleRoomTypeChange("public");
    handleChatRoomIdChange(userData?.user?.publicRoomId);

    // Remove active friend selection
    setFriendRoom((prev) =>
      prev.map((friend) => ({
        ...friend,
        isCurrent: false,
      })),
    );
    handlePartnerChange(null);
  }, [roomType]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedFilter === "friends") {
        getPrivateRoom();
      } else {
        getAllUsers();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (selectedFilter === "friends") {
      getPrivateRoom();
    } else {
      getAllUsers();
    }
  }, [selectedFilter]);

  // Private rooms are also needed on the All Users tab, to open a chat from there
  useEffect(() => {
    getPrivateRoom();
  }, []);

  // A message from a chat we don't know yet (someone just added us as a friend):
  // reload the rooms so that person's row can show its unread count
  const lastUnknownRooms = useRef("");
  useEffect(() => {
    const knownRooms = new Set(friendRoom.map((room) => room._id));
    const unknownRooms = Object.keys(unreadCounts || {})
      .filter((roomId) => roomId !== userData?.user?.publicRoomId && !knownRooms.has(roomId))
      .sort()
      .join(",");
    if (unknownRooms && unknownRooms !== lastUnknownRooms.current) {
      lastUnknownRooms.current = unknownRooms;
      getPrivateRoom();
      getAllUsers();
    }
  }, [unreadCounts, friendRoom]);

  const findRoomWith = (rooms, userId) =>
    rooms.find((room) => room?.friend?._id === userId);

  // Open the private chat with someone from the All Users list
  const openChatWith = async (user) => {
    let room = findRoomWith(friendRoom, user._id);

    if (!room) {
      // Rooms may be stale (e.g. just added as a friend), so fetch them fresh
      try {
        const response = await GET(
          "room/private",
          { type: "private", participants: [userData?.user?.userId] },
          {},
          {},
        );
        if (response?.success) {
          const rooms = response.data.map((r) => ({ ...r, isCurrent: false }));
          setFriendRoom(rooms);
          room = findRoomWith(rooms, user._id);
        }
      } catch (error) {
        console.error(error);
      }
    }

    if (room) {
      handleChatRoomChange(room);
    } else {
      toast.info(`Add ${user.name} as a friend to start chatting`);
    }
  };

  const handleChatRoomChange = (room) => {
    handleChatRoomIdChange(room._id);
    handleRoomTypeChange("private");
    handlePartnerChange(room?.friend);
    setFriendRoom((prevFriends) =>
      prevFriends.map((friend) => ({
        ...friend,
        isCurrent: friend._id === room._id,
      })),
    );
    // On small screens the panel covers the chat, so get out of the way
    closeOnlineUsers?.();
  };

  const onlineCount = allUsers.filter((u) => u.isOnline === true);
  const awayCount = allUsers.filter((u) => u.isOnline === false);
  // Online people first, then the rest by most recently seen
  const sortedUsers = [...allUsers].sort(
    (a, b) =>
      Number(!!b.isOnline) - Number(!!a.isOnline) ||
      new Date(b.lastSeen || 0) - new Date(a.lastSeen || 0),
  );

  const unreadFor = (roomId) => (roomId ? unreadCounts?.[roomId] || 0 : 0);
  const publicRoomId = userData?.user?.publicRoomId;
  const friendsUnread = friendRoom.reduce((sum, room) => sum + unreadFor(room._id), 0);

  const badge = (count) =>
    count > 0 && (
      <span className="shrink-0 min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-rose-500 text-white text-[11px] font-bold leading-none shadow-lg shadow-rose-500/30">
        {count > 99 ? "99+" : count}
      </span>
    );

  const openPublicRoom = () => {
    handleRoomTypeChange("public");
    handleChatRoomIdChange(publicRoomId);
    closeOnlineUsers?.();
  };

  const tabClass = (active) =>
    `flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold py-1.5 rounded-lg transition-all cursor-pointer ${
      active
        ? "bg-white text-gray-900 shadow-sm"
        : "text-gray-500 hover:text-gray-800"
    }`;

  const avatar = (name, isOnline) => (
    <div className="relative shrink-0">
      <div
        className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold bg-gradient-to-br ${avatarGradient(name)} ${
          isOnline ? "" : "opacity-50 saturate-50"
        }`}
      >
        {name?.charAt(0)?.toUpperCase()}
      </div>
      <span
        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-white ${
          isOnline ? "bg-emerald-500" : "bg-gray-300"
        }`}
      />
    </div>
  );

  const status = (isOnline, lastSeen) => (
    <p className={`text-xs truncate ${isOnline ? "text-emerald-600" : "text-gray-500"}`}>
      {isOnline ? "Online" : FormatLastSeen(lastSeen)}
    </p>
  );

  return (
    <>
      {/* Backdrop behind the slide-over panel (below lg) */}
      <div
        onClick={closeOnlineUsers}
        className={`fixed inset-0 z-30 bg-gray-900/30 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${
          showOnlineUsers ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        className={`fixed inset-y-0 right-0 z-40
          w-full sm:w-96 lg:w-80 xl:w-96
          transform ${showOnlineUsers ? "translate-x-0" : "translate-x-full"}
          transition-transform duration-300 ease-out
          glass-pane glass-pane--overlay
          ${showOnlineUsers ? "shadow-2xl" : ""} lg:shadow-none
          lg:static lg:translate-x-0 lg:shrink-0
          flex flex-col
          border-l border-white/60
        `}
      >
        {/* Header: title, tabs, search */}
        <div className="px-4 pt-4 pb-3 space-y-3 border-b border-white/60">
          <div className="flex items-center gap-2">
            <button
              onClick={handleShowOnlineUsers}
              title="Close"
              className="lg:hidden shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:bg-white/60 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold tracking-tight text-gray-900">People</h2>
            <span className="text-xs font-semibold text-violet-700 bg-violet-100/80 rounded-full px-2 py-0.5">
              {allUsers.length}
            </span>
          </div>

          <div className="flex gap-1 p-1 bg-white/40 border border-white/60 rounded-xl">
            <button
              onClick={() => setSelectedFilter("all")}
              className={tabClass(selectedFilter === "all")}
            >
              <Users2Icon className="w-4 h-4" />
              All Users
            </button>
            <button
              onClick={() => setSelectedFilter("friends")}
              className={tabClass(selectedFilter === "friends")}
            >
              <Handshake className="w-4 h-4" />
              Friends
              {friendsUnread > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold leading-none">
                  {friendsUnread > 99 ? "99+" : friendsUnread}
                </span>
              )}
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none z-10" />
            <input
              type="text"
              placeholder="Search people..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 field rounded-xl pl-9 pr-9 text-base lg:text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                title="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {/* Public room, always reachable from here */}
          <div
            onClick={openPublicRoom}
            title="Open Public Room"
            className={`flex items-center gap-3 px-3 py-2.5 mb-1 rounded-xl cursor-pointer transition-colors ${
              roomType === "public" ? "bg-white/75 ring-1 ring-violet-200 shadow-sm" : "hover:bg-white/50"
            }`}
          >
            <div className="w-11 h-11 shrink-0 rounded-full brand-bg flex items-center justify-center text-white shadow-lg shadow-violet-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className={`text-sm truncate ${unreadFor(publicRoomId) ? "font-bold text-gray-900" : "font-semibold text-gray-800"}`}>
                Public Room
              </h3>
              <p className="text-xs text-gray-500 truncate">Open for everyone</p>
            </div>
            {badge(unreadFor(publicRoomId))}
          </div>
          <div className="mx-3 mb-1 border-t border-white/60" />

          {isLoading ? (
            Array(6)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 animate-pulse">
                  <div className="w-11 h-11 rounded-full bg-white/60" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-28 bg-white/60 rounded" />
                    <div className="h-3 w-16 bg-white/40 rounded" />
                  </div>
                </div>
              ))
          ) : selectedFilter === "friends" && friendRoom.length > 0 ? (
            <div className="space-y-1">
              {friendRoom.map((room) => (
                <div
                  key={room._id}
                  onClick={() => handleChatRoomChange(room)}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                    room.isCurrent
                      ? "bg-white/75 ring-1 ring-violet-200 shadow-sm"
                      : "hover:bg-white/50"
                  }`}
                >
                  {avatar(room?.friend?.name, room?.friend?.isOnline)}
                  <div className="min-w-0 flex-1">
                    <h3 className={`text-sm truncate ${unreadFor(room._id) ? "font-bold text-gray-900" : "font-semibold text-gray-800"}`}>
                      {room?.friend?.name}
                    </h3>
                    {status(room?.friend?.isOnline, room?.friend?.lastSeen)}
                  </div>
                  {badge(unreadFor(room._id)) || (
                    <MessageCircle className="w-4 h-4 text-gray-400 group-hover:text-violet-600 transition-colors" />
                  )}
                </div>
              ))}
            </div>
          ) : selectedFilter === "all" && allUsers.length > 0 ? (
            <div className="space-y-1">
              {sortedUsers.map((user, index) => {
                const userRoom = findRoomWith(friendRoom, user._id);
                const canChat = user?.isFriend || !!userRoom;
                const userUnread = unreadFor(userRoom?._id);
                return (
                <div
                  key={user._id || index}
                  onClick={canChat ? () => openChatWith(user) : undefined}
                  title={canChat ? `Chat with ${user.name}` : undefined}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/50 transition-colors animate-fadeIn ${
                    canChat ? "cursor-pointer" : ""
                  }`}
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  {avatar(user.name || user?.friendId?.name, user.isOnline)}
                  <div className="min-w-0 flex-1">
                    <h3 className={`text-sm truncate ${userUnread ? "font-bold text-gray-900" : "font-semibold text-gray-800"}`}>
                      {user.name || user?.friendId?.name}
                    </h3>
                    {status(user.isOnline, user.lastSeen)}
                  </div>
                  {userUnread > 0 ? (
                    badge(userUnread)
                  ) : !user?.isFriend ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddFriend(user._id);
                      }}
                      title="Add Friend"
                      className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-violet-600 bg-white/60 border border-white/80 hover:bg-violet-600 hover:text-white hover:border-violet-600 transition-colors"
                    >
                      <UserPlus2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-violet-700 bg-violet-100/80 group-hover:bg-violet-200/80 rounded-full px-2 py-0.5 transition-colors">
                      <MessageCircle className="w-3 h-3" />
                      Chat
                    </span>
                  )}
                </div>
                );
              })}
            </div>
          ) : (
            // Empty state
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-16 h-16 mb-4 rounded-full bg-white/60 flex items-center justify-center">
                <Users className="w-8 h-8 text-violet-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                {selectedFilter === "all" ? "No users found" : "No friends yet"}
              </h3>
              <p className="text-sm text-gray-500 max-w-[240px]">
                {searchTerm
                  ? "No matches for your search"
                  : selectedFilter === "all"
                    ? "Be the first to join the community!"
                    : "Add someone as a friend from All Users"}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-4 px-4 py-2 text-sm font-medium text-violet-700 bg-violet-100/80 hover:bg-violet-200/80 rounded-lg transition-colors"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer with stats */}
        <div className="flex items-center gap-4 px-5 py-3 border-t border-white/60 text-xs text-gray-500 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            {onlineCount.length} online
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-300" />
            {awayCount.length} away
          </span>
        </div>

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.35s ease-out forwards;
            opacity: 0;
          }
        `}</style>
      </aside>
    </>
  );
};

export default OnlineUsers;
