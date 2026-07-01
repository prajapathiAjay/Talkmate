import mongoose from "mongoose";
const friendSchema=new mongoose.Schema({

    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    friendId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    createdAt:{
        type:Date,
        default:Date.now
    }



},{timestamps:true})

export const FriendModel=mongoose.model("Friend",friendSchema)