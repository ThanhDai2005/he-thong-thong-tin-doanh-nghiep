import express from "express";
import * as controller from "../controllers/survey.controller.js";

const router = express.Router();

router.get("/", controller.list);

router.get("/my-responses", controller.myResponses);

router.get("/:surveyId", controller.detail);

router.post("/:surveyId/submit", controller.submit);

export default router;
