import {FriendModel} from "./friend.schema.js"


export const getFriendsRepo=async(userId)=>{

try{
const response=await FriendModel.find({userId}).populate("friendId",  "name email isOnline lastSeen")
    return {
        success:true,
        status:200,
        data:response
    }

}catch(error){
    return {
        success:false,
        error:{
            statusCode:500,
            message:error
        }
    }



}
}






export const addFriendRepo=async(friend)=>{
    
    try{
        const response=await FriendModel.create(fried)
        return {
            success:true,
            status:200,
            data:response
        }

    }catch(error){
        return {
            success:false,
            error:{
                statusCode:500,
                message:error
            }
        }
    }
}