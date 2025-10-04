import { Router } from "express";
import {
    addMembersToProject,
    createProject,
    deleteMember,
    getProjects,
    getProjectById,
    getProjectMembers,
    updateProject,
    deleteProject,
    updateMemberRole,
} from "../controllers/project.controllers";
import {
    verifyJwt,
    validateProjectPermission,
} from "../middlewares/auth.middlewares";
import { AvailableUserRole, UserRolesEnum } from "../types/usertype";

const projectRouter = Router();
projectRouter.use(verifyJwt);

projectRouter.route("/").get(getProjects).post(createProject);

projectRouter
    .route("/:projectId")
    .get(
        validateProjectPermission([
            UserRolesEnum.MEMBER,
            UserRolesEnum.PROJECT_ADMIN,
            UserRolesEnum.ADMIN,
        ]),
        getProjectById,
    )
    .put(validateProjectPermission([UserRolesEnum.ADMIN]), updateProject)
    .delete(validateProjectPermission([UserRolesEnum.ADMIN]), deleteProject);

projectRouter
    .route("/:projectId/members")
    .get(getProjectMembers)
    .post(
        validateProjectPermission([UserRolesEnum.ADMIN]),
        addMembersToProject,
    );

projectRouter
    .route("/:projectId/members/:userId")
    .put(validateProjectPermission([UserRolesEnum.ADMIN]), updateMemberRole)
    .delete(validateProjectPermission([UserRolesEnum.ADMIN]), deleteMember);

export default projectRouter;
