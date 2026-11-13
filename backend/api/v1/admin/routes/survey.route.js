import express from "express";
import * as controller from "../controllers/survey.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/permission.middleware.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", requirePermission("surveys_view"), controller.list);

router.get(
  "/recipients",
  requirePermission("surveys_view"),
  controller.recipients,
);

router.post(
  "/:surveyId/send",
  requirePermission("surveys_edit"),
  controller.send,
);

router.get("/:surveyId", requirePermission("surveys_view"), controller.detail);

router.post("/", requirePermission("surveys_create"), controller.create);

router.patch(
  "/:surveyId",
  requirePermission("surveys_edit"),
  controller.update,
);

router.patch(
  "/change-status/:surveyId",
  requirePermission("surveys_edit"),
  controller.changeStatus,
);

router.get(
  "/:surveyId/responses",
  requirePermission("surveys_view"),
  controller.getResponses,
);

router.get(
  "/:surveyId/statistics",
  requirePermission("surveys_view"),
  controller.getStatistics,
);

export default router;
