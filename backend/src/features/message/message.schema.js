import mongoose from "mongoose";


const messageSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: function () {
            return this.type === "user"
        }


    },
    senderName: {
        type: String,
        required: function () {
            return this.type === "user"
        },

    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ["user", "system","join","leave"],
        default: "user"
    }


}, { timestamps: true })



export const MessageModel = mongoose.model("Message", messageSchema)






