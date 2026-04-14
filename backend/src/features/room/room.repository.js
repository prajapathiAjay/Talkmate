import { RoomModel } from "./room.schema.js"

export const roomCreationRepo = async (roomData) => {

    try {
        if (!roomData?.roomName || !roomData?.type) {
            return {
                success: false,
                error: {
                    statusCode: 400,
                    message: "Room  type is required"
                }
            }
        }
        let existingRoom

        if (roomData?.type === "private") {
            const users = roomData.participants
            existingRoom = await RoomModel.findOne({
                type: "private", participants: {
                    $all: users,
                    $size: users.length
                }
            })



        }



        const newRoom = new RoomModel(roomData)
        await newRoom.save()

        return {
            success: true,
            status: 201,
            message: `New room with name:${newRoom?.roomName} has been created uccessfully`,



        }

    } catch (error) {
        if (error.code === 11000) {
            return {
                success: false,
                error: {
                    statusCode: 409, // Conflict
                    message: "Room name already exists"
                }
            };
        }

        return {
            success: false,
            error: {
                statusCode: 500,
                message: error
            }


        }

    }


}



export const getRoomDataRepo=async (roomData)=>{


    try {
      
   
        
    } catch (error) {
        
    }






}