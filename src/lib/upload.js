import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

/**
 * Uploads a file to Firebase Storage and returns the download URL
 * @param {File} file - The file to upload
 * @returns {Promise<string>} - The download URL of the uploaded file
 */
const upload = async (file) => {
  try {
    console.log("Starting file upload process...");
    console.log("File details:", {
      name: file.name,
      type: file.type,
      size: file.size
    });

    const uniqueId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${uniqueId}.${fileExtension}`;
    console.log("Generated unique filename:", uniqueFileName);
   
    const storageRef = ref(storage, `images/${uniqueFileName}`);
    console.log("Storage reference created");
    
    console.log("Uploading file to Firebase Storage...");
    const snapshot = await uploadBytes(storageRef, file);
    console.log("File uploaded successfully, getting download URL...");
      
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log("Download URL received:", downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error("Error in upload function:", error);
    console.error("Error details:", {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    throw new Error(`Upload failed: ${error.message}`);
  }
};

export default upload;