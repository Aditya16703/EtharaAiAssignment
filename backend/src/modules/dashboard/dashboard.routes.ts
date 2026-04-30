import { Router } from "express";
import { DashboardController } from "./dashboard.controller";
import { authenticate } from "../../middleware/authenticate";

const router = Router();

router.use(authenticate);

router.get("/summary", DashboardController.summary);
router.get("/my-issues", DashboardController.myIssues);
router.get("/overdue", DashboardController.overdue);

export { router as dashboardRoutes };
