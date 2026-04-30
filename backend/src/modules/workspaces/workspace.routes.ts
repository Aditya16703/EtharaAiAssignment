import { Router } from "express";
import { WorkspaceController } from "./workspace.controller";
import { authenticate } from "../../middleware/authenticate";
import { requireRole } from "../../middleware/requireRole";

const router = Router();

router.use(authenticate);

router.get("/", WorkspaceController.list);
router.post("/", WorkspaceController.create);

router.get("/:slug", requireRole("MEMBER"), WorkspaceController.get);
router.patch("/:slug", requireRole("ADMIN"), WorkspaceController.update);
router.delete("/:slug", requireRole("ADMIN"), WorkspaceController.delete);

export { router as workspaceRoutes };
