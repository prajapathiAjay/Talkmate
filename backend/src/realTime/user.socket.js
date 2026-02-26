import { handleOnlineUsersrepo } from "../features/user/user.reposotory.js"

const onlineUsers = new Map()

export const handleOnlineUsers = async (socket) => {
   // console.log("handleOnline triggear")
   try {
      const userId = socket.user.id
      let isFirstConnection = false

      if (!onlineUsers.has(userId)) {
         onlineUsers.set(userId, new Set())
         isFirstConnection = true
      }

      onlineUsers.get(userId).add(socket.id)

      if (isFirstConnection) {
         const response = await handleOnlineUsersrepo(true, userId);

         if (response.success) {

            socket.broadcast.emit("user-status-changed", response)
         }
         console.log("connectresponse", response)

      }

   } catch (error) {
      console.error("Error in handleOnlineUsers:", error)
   }
}


export const handleOfflineUser = async (socket) => {

   try {
      const userId = socket.user.id
      if (!onlineUsers.has(userId)) {
         return
      }
      onlineUsers.get(userId).delete(socket.id)
      if (onlineUsers.get(userId).size === 0) {
         onlineUsers.delete(userId)

         const response = await handleOnlineUsersrepo(false, userId)
         if (!response.success) {
            return
         }
         console.log("disconnectresponse", response)
         socket.broadcast.emit("use-status-changed", response)

      }

   } catch (error) {
      console.error("Error in handleOflineUsers:", error)
   }













}