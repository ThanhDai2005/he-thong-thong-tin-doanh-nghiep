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
        resource_type: "auto",
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
    transformation: [{ width: 200, height: 200, crop: "fill" }],
  });
};

const uploadProductImage = async (buffer) => {
  return await streamUpload(buffer, {
    folder: "CAU_TRUC_DU_AN_MERN/product",
  });
};

const uploadBlogImage = async (buffer) => {
  return await streamUpload(buffer, {
    folder: "CAU_TRUC_DU_AN_MERN/blog",
  });
};

const uploadEditorImage = async (buffer) => {
  return await streamUpload(buffer, {
    folder: "CAU_TRUC_DU_AN_MERN/editor",
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
    } else if (req.file.fieldname == "imageUrl") {
      result = await uploadBlogImage(req.file.buffer);
    } else if (req.file.fieldname == "file") {
      result = await uploadEditorImage(req.file.buffer);
    }

    req.body[req.file.fieldname] = result.secure_url;
  } catch (error) {
    logger.logError("Lỗi khi upload file (admin)", error, {
      fieldname: req.file?.fieldname,
      adminId: req.user?._id,
      endpoint: req.originalUrl,
    });
    return res.status(500).json({ message: "Lỗi khi upload file" });
  }

  next();
};

// upload nhiều file gồm ảnh video tài liệu
export const uploadMulti = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next();
    }

    const uploads = req.files.map((file) => uploadProductImage(file.buffer));
    const results = await Promise.all(uploads);
    const fieldName = req.files[0].fieldname;

    req.body[fieldName] = results.map((item, index) => item.secure_url);
  } catch (error) {
    logger.logError("Lỗi khi upload nhiều files (admin)", error, {
      filesCount: req.files?.length,
      fieldname: req.files?.[0]?.fieldname,
      adminId: req.user?._id,
      endpoint: req.originalUrl,
    });
    return res.status(500).json({ message: "Lỗi khi upload files" });
  }

  next();
};
