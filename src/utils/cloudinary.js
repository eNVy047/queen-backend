import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    if (!fs.existsSync(localFilePath)) {
      console.error("Local file not found:", localFilePath);
      return null;
    }

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    //console.log("Cloudinary upload response:", response);

    await fs.promises.unlink(localFilePath);

    return response;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    try {
      await fs.promises.unlink(localFilePath);
    } catch (err) {
      console.error("Failed to delete temp file:", err);
    }
    return null;
  }
};

export { uploadOnCloudinary };
