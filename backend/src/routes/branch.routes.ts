import { Router } from "express";
import { listBranches, nearbyBranches, createBranch, deleteBranch } from "../controllers/branch.controller";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();

router.get("/", listBranches);
router.get("/nearby", nearbyBranches);
router.post("/", requireAuth, requireAdmin, createBranch);
router.delete("/:id", requireAuth, requireAdmin, deleteBranch);

export default router;
