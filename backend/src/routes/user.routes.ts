import { Router } from "express";
import { updateProfile, updateAddresses, getLoyaltyStatus, redeemLoyaltyReward } from "../controllers/user.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.put("/profile", updateProfile);
router.put("/addresses", updateAddresses);
router.get("/loyalty", getLoyaltyStatus);
router.post("/loyalty/redeem", redeemLoyaltyReward);

export default router;
