import { createContext, useContext, useState, useEffect } from "react";
import CustomApiService from "../services/CustomApiService";
import { useAuth } from "./AuthProvider.jsx";
const RoomContext = createContext();

export const RoomProvider = ({ children }) => {
  console.log("RoomProvider file loaded");
  const { GET } = CustomApiService();
  const { userData } = useAuth();
  const [roomId, setRoomId] = useState();
  const [roomData,setRoomData]= useState()
  //   Fetch Room Data
  const fetchRoomData = async () => {
    console.log("roomData provider")
    const params = {
      type: "public",
      roomId:roomId|| null
    };
    try {
      const response = await GET("room",params);
      if (response?.success) {
        const roomData=response?.data
        const roomId=response?.data?._id
        setRoomId(roomId);
        setRoomData(roomData)
      } else {
      }
    } catch (error) {
      throw new Error("Room Api error", error);
    }
  };

  useEffect(()=>{
      console.log("RoomProvider Mounted");
      if(userData){
        fetchRoomData()
      }

  },[userData])

  return (
    <RoomContext.Provider value={{ roomId, setRoomId,roomData }}>
      {children}
    </RoomContext.Provider>
  );
};

export const useRoom = () => {
  const context = useContext(RoomContext);

  if (!context) {
    throw new Error("useRoommust be used within RoomProvider ");
  }

  return context;
};
