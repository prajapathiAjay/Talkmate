import mongoose from "mongoose";


const messageSchema = new mongoose.Schema({
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
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
        
    },
    attachments: [{
        fileUrl: {
            type: String,
            required:false
        },
        fileName: {
            type: String,
            required:false
        },
        fileType: {
            type: String,
            required:false
        }
    }],
    messageType: {
        type: String,
        enum: ["user", "system", "join", "leave"],
        default: "user"
    }


}, { timestamps: true })



export const MessageModel = mongoose.model("Message", messageSchema)






