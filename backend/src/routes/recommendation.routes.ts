import { Router } from "express";
import { recommend } from "../controllers/recommendation.controller";
import { optionalAuth } from "../middleware/auth";

const router = Router();
router.get("/", optionalAuth, recommend);

export default router;
