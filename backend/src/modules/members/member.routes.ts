import { Router } from "express";
import { MemberController } from "./member.controller";
import { authenticate } from "../../middleware/authenticate";
import { requireRole } from "../../middleware/requireRole";

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get("/", requireRole("MEMBER"), MemberController.list);
router.post("/", requireRole("ADMIN"), MemberController.invite);

router.patch("/:userId/role", requireRole("ADMIN"), MemberController.changeRole);
router.delete("/:userId", requireRole("ADMIN"), MemberController.remove);

export { router as memberRoutes };
