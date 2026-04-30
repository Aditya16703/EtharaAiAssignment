import { Router } from "express";
import { IssueController } from "./issue.controller";
import { authenticate } from "../../middleware/authenticate";
import { requireRole } from "../../middleware/requireRole";

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get("/", requireRole("MEMBER"), IssueController.list);
router.post("/", requireRole("ADMIN"), IssueController.create);
router.get("/:id", requireRole("MEMBER"), IssueController.get);
router.patch("/:id", requireRole("ADMIN"), IssueController.update);
router.patch("/:id/status", requireRole("MEMBER"), IssueController.updateStatus); // Status has specific auth inside controller
router.patch("/:id/assign", requireRole("ADMIN"), IssueController.updateAssignee);
router.delete("/:id", requireRole("ADMIN"), IssueController.delete);

export { router as issueRoutes };
