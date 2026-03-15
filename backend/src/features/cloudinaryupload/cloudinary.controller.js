
export const messageFileUpload = async (req, res, next) => {

    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "no files uploaded" })
    }

    const files = req.files.map((file) => {
         return {
            fileUrl: file.path,
            fileName: file.originalname,
            fileType: file.mimetype   // <-- file type
        }
    })

    res.status(200).json({
        message: "files uploaded successfully",
        files
    })
}