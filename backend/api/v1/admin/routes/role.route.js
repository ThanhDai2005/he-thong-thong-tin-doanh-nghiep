import express from "express";
const router = express.Router();

import * as controller from "../controllers/role.controller.js";
import { requirePermission } from "../middlewares/permission.middleware.js";

router.get("/", requirePermission("roles_view"), controller.list);

router.post("/", requirePermission("roles_create"), controller.create);

router.get(
  "/detail/:roleId",
  requirePermission("roles_view"),
  controller.detail,
);

router.patch(
  "/update/:roleId",
  requirePermission("roles_edit"),
  controller.update,
);

router.patch(
  "/delete/:roleId",
  requirePermission("roles_delete"),
  controller.deleteItem,
);

router.get(
  "/permissions",
  requirePermission("roles_view"),
  controller.getPermissions,
);

router.patch(
  "/:roleId/permissions",
  requirePermission("roles_permissions"),
  controller.updatePermissions,
);

export default router;
