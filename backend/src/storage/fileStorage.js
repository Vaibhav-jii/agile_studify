/**
 * Simple file storage utility for Sprint 1
 * This is a placeholder for future backend integration
 * Currently, frontend uses localStorage
 */

const fs = require("fs");
const path = require("path");

// Storage directory for uploaded files
const UPLOAD_DIR = path.join(__dirname, "../../uploads");

/**
 * Initialize storage directory
 */
function initStorage() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log("✅ Upload directory created:", UPLOAD_DIR);
  }
}

/**
 * Save file to storage
 * @param {Buffer} fileBuffer - File content as buffer
 * @param {string} fileName - Original file name
 * @param {string} subjectId - Subject ID for organization
 * @returns {Promise<string>} - File path
 */
async function saveFile(fileBuffer, fileName, subjectId) {
  try {
    // Create subject directory if not exists
    const subjectDir = path.join(UPLOAD_DIR, subjectId);
    if (!fs.existsSync(subjectDir)) {
      fs.mkdirSync(subjectDir, { recursive: true });
    }

    // Generate unique file name
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}_${fileName}`;
    const filePath = path.join(subjectDir, uniqueFileName);

    // Save file
    await fs.promises.writeFile(filePath, fileBuffer);

    return filePath;
  } catch (error) {
    console.error("Error saving file:", error);
    throw new Error("Failed to save file");
  }
}

/**
 * Delete file from storage
 * @param {string} filePath - Path to file
 * @returns {Promise<boolean>} - Success status
 */
async function deleteFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error deleting file:", error);
    return false;
  }
}

/**
 * Get file from storage
 * @param {string} filePath - Path to file
 * @returns {Promise<Buffer>} - File content
 */
async function getFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error("File not found");
    }
    return await fs.promises.readFile(filePath);
  } catch (error) {
    console.error("Error reading file:", error);
    throw new Error("Failed to read file");
  }
}

/**
 * Get file size
 * @param {string} filePath - Path to file
 * @returns {Promise<number>} - File size in bytes
 */
async function getFileSize(filePath) {
  try {
    const stats = await fs.promises.stat(filePath);
    return stats.size;
  } catch (error) {
    console.error("Error getting file size:", error);
    return 0;
  }
}

// Initialize storage on module load
initStorage();

module.exports = {
  saveFile,
  deleteFile,
  getFile,
  getFileSize,
  UPLOAD_DIR,
};
