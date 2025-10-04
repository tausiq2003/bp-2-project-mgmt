import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const uploadOnCloudinary = async (localFilePath: string | undefined) => {
    console.log(process.env.CLOUDINARY_CLOUD_NAME!);
    console.log(cloudinary.config());
    try {
        if (!localFilePath) return null;
        //upload the file on cloudinary
        if (!fs.existsSync(localFilePath)) {
            return null;
        }
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
        // file has been uploaded successfull
        //console.log("file is uploaded on cloudinary ", response.url);
        try {
            fs.unlinkSync(localFilePath);
        } catch (error) {
            console.error("couldn't delete local file", localFilePath);
            console.error((error as Error)?.message);
        }
        return response;
    } catch (error) {
        console.error("Cloudinary upload failed", (error as Error)?.message);
        try {
            if (localFilePath && fs.existsSync(localFilePath)) {
                fs.unlinkSync(localFilePath);
            }
        } catch (err) {
            console.error(
                "Warning!! couldn't cleanup local file after upload failure",
                (err as Error)?.message,
            );
        }
        return null;
    }
};
export const deleteFromCloudinary = async function (
    url: string,
    resourceType: "image" | "raw" = "raw",
) {
    try {
        const urlPart = url.split("/").pop();
        if (!urlPart) {
            throw new Error("Invalid URL format");
        }

        const publicId = urlPart.split(".")[0];
        if (!publicId) {
            throw new Error("Could not extract public ID from URL");
        }

        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
        });

        return result;
    } catch (error) {
        console.error("Cloudinary deletion failed:", (error as Error)?.message);
        return null;
    }
};
export { uploadOnCloudinary };
