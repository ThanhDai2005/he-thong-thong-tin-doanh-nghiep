import { v2 as cloudinary } from "cloudinary";
import logger from "../../../../config/logger.js";

let streamUpload = (buffer, options) => {
  return new Promise((resolve, reject) => {
    let stream = cloudinary.uploader.upload_stream(
      {
        cloud_name: process.env.CLOUD_NAME,
        api_key: process.env.CLOUD_KEY,
        api_secret: process.env.CLOUD_SECRET,
        folder: "CAU_TRUC_DU_AN_MERN",
        resource_type: "image",
        ...options,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      },
    );

    stream.end(buffer);
  });
};

const uploadAvatar = async (buffer) => {
  return await streamUpload(buffer, {
    folder: "CAU_TRUC_DU_AN_MERN/avatar",
  });
};

const uploadReviewImage = async (buffer) => {
  return await streamUpload(buffer, {
    folder: "CAU_TRUC_DU_AN_MERN/reviews",
  });
};

// Upload 1 ảnh
export const uploadSingle = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    let result;

    if (req.file.fieldname == "avatar") {
      result = await uploadAvatar(req.file.buffer);
    }

    req.body[req.file.fieldname] = result.secure_url;
  } catch (error) {
    logger.logError("Lỗi khi upload file", error, {
      fieldname: req.file?.fieldname,
      endpoint: req.originalUrl,
    });
    return res.status(500).json({ message: "Lỗi khi upload file" });
  }

  next();
};

// upload nhiều ảnh
export const uploadMulti = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next();
    }

    const fieldName = req.files[0].fieldname;
    let uploadFunction;

    if (fieldName == "images") {
      uploadFunction = uploadReviewImage;
    }

    const uploads = req.files.map((file) => uploadFunction(file.buffer));
    const results = await Promise.all(uploads);

    req.body[fieldName] = results.map((item, index) => item.secure_url);
  } catch (error) {
    logger.logError("Lỗi khi upload nhiều files", error, {
      filesCount: req.files?.length,
      fieldname: req.files?.[0]?.fieldname,
      endpoint: req.originalUrl,
    });
    return res.status(500).json({ message: "Lỗi khi upload files" });
  }

  next();
};
