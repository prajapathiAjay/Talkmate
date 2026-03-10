import multer from "multer";
import {CloudinaryStorage} from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";


const storage= new CloudinaryStorage({
    cloudinary:cloudinary,
    params:{
        folder:"talkmate-uploads",
        allowed_formats:["jpg","jpeg","png"

        ]
    }
})

const upload=multer({storage:storage})
export default upload;