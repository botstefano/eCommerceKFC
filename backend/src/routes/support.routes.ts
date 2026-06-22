import { Router } from "express";
import { getFaq, chatSimulated, createTicket, listTickets, updateTicketStatus } from "../controllers/support.controller";
import { requireAuth, requireAdmin, optionalAuth } from "../middleware/auth";

const router = Router();

router.get("/faq", getFaq);
router.post("/chat", chatSimulated);
router.post("/tickets", optionalAuth, createTicket);
router.get("/admin/tickets", requireAuth, requireAdmin, listTickets);
router.put("/admin/tickets/:id", requireAuth, requireAdmin, updateTicketStatus);

export default router;
