import type { Request } from "express";
import type { JwtPayload } from "jsonwebtoken";

export enum UserRolesEnum {
    "ADMIN" = "admin",
    "PROJECT_ADMIN" = "project_admin",
    "MEMBER" = "member",
}
export enum TaskStatusEnum {
    "TODO" = "todo",
    "IN_PROGRESS" = "in_progress",
    "DONE" = "done",
}

export interface AuthenticatedRequest extends Request {
    user?: JwtPayload;
}
