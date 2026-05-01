import { createContext, useContext, useState, useEffect } from "react";
import CustomApiService from "../services/CustomApiService";
const RoomContext = createContext();

export const RoomProvider = ({ children }) => {
  const { GET } = CustomApiService();

  const [roomId, setRoomId] = useState();
  const [roomData,setRoomData]= useState()
  //   Fetch Room Data
  const fetchRoomData = async () => {
    console.log("roomData api is trigered")
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
      throw new Error(error);
    }
  };

  useEffect(()=>{
fetchRoomData()
  },[])

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
