const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { Readable } = require('stream');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');
const { fileTypes } = require('../constants');

// ✅ FIX: UNCOMMENTED BLOCK. This sets the Cloudinary credentials (which are now loaded globally by index.js/server.js).
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 120000, // Wait 120 seconds (2 minutes) before failing
});

const storage = multer.memoryStorage();

async function fileFilter(req, file, cb) {
  if (fileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(httpStatus.BAD_REQUEST, 'Invalid file type'), false);
  }
}

const multerUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
});

const uploadStream = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            key: result.public_id,
            url: result.secure_url,
          });
        }
      }
    );
    Readable.from(fileBuffer).pipe(stream);
  });
};

async function s3Upload(files, folder = 'uploads', private = false) {
  if (!Array.isArray(files)) {
    files = [files];
  }

  try {
    const uploadPromises = files.map((file) => {
      return uploadStream(file.buffer, folder);
    });

    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    // Return specific error if it's a timeout
    if (error.name === 'TimeoutError' || error.http_code === 499) {
      throw new ApiError(httpStatus.REQUEST_TIMEOUT, 'Image upload timed out. Please check your internet connection.');
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to upload media');
  }
}

async function s3Delete(Key) {
  try {
    return await cloudinary.uploader.destroy(Key);
  } catch (error) {
    console.error('Cloudinary Delete Error:', error);
    return null;
  }
}

async function getObjectURL(Key) {
  const url = cloudinary.url(Key, { secure: true });
  return {
    key: Key,
    url: url,
  };
}

async function s3Upsert({ file, existingFileKey = null, folder }) {
  if (!file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No file provided for upsert');
  }
  if (existingFileKey) {
    await s3Delete(existingFileKey);
  }
  const result = await uploadStream(file.buffer, folder);
  return result;
}

async function s3Move(sourceKey, destinationFolderName) {
  try {
    const fileName = sourceKey.split('/').pop();
    const newPublicId = `${destinationFolderName}/${fileName}`;
    const result = await cloudinary.uploader.rename(sourceKey, newPublicId);
    return {
      key: result.public_id,
      url: result.secure_url
    };
  } catch (error) {
    console.error('Cloudinary Move Error:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to move file');
  }
}

module.exports = {
  s3Upload,
  s3Delete,
  s3Move,
  s3Upsert,
  getObjectURL,
  multerUpload,
};