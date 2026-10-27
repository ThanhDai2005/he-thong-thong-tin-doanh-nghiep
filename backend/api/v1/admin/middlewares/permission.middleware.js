import Role from "../../../../models/role.model.js";
import logger from "../../../../config/logger.js";

export const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      const user = req.user;

      if (!user.roleId._id) {
        return res.status(403).json({
          message:
            "Tài khoản chưa được gán vai trò. Vui lòng liên hệ quản trị viên.",
        });
      }

      const role = await Role.findOne({
        _id: user.roleId._id,
        deleted: false,
      });

      if (!role) {
        return res.status(403).json({
          message:
            "Vai trò không tồn tại hoặc đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.",
        });
      }

      if (!role.permissions.includes(permission)) {
        return res.status(403).json({
          message: "Bạn không có quyền thực hiện hành động này",
        });
      }

      next();
    } catch (error) {
      logger.logError("Lỗi khi kiểm tra quyền", error, {
        userId: req.user?._id,
        permission: permission,
        endpoint: req.originalUrl,
      });
      res.status(500).json({
        message: "Lỗi hệ thống",
      });
    }
  };
};
