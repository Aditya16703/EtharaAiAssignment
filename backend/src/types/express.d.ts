import { User, WorkspaceMember, Workspace } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      workspaceMember?: WorkspaceMember;
      workspace?: Workspace;
    }
  }
}
