import { Router } from "express";

import {
    listProjectTasks,
    createProjectTask,
    getTaskDetails,
    updateTask,
    deleteTask,
    createSubTask,
    updateSubTask,
    deleteSubTask,
} from "../controllers/tasks.controllers";
import {
    verifyJwt,
    validateProjectPermission,
} from "../middlewares/auth.middlewares";
import { UserRolesEnum } from "../types/usertype";
import { upload } from "../middlewares/multer.middlewares";

const tasksRouter = Router();
tasksRouter.use(verifyJwt);

tasksRouter
    .route("/:projectId")
    .get(listProjectTasks)
    .post(
        validateProjectPermission([
            UserRolesEnum.ADMIN,
            UserRolesEnum.PROJECT_ADMIN,
        ]),
        upload.array("attachments", 5),
        createProjectTask,
    );

tasksRouter
    .route("/:projectId/t/:taskId")
    .get(getTaskDetails)
    .put(
        validateProjectPermission([
            UserRolesEnum.ADMIN,
            UserRolesEnum.PROJECT_ADMIN,
        ]),
        upload.array("attachments", 5),
        updateTask,
    )
    .delete(
        validateProjectPermission([
            UserRolesEnum.ADMIN,
            UserRolesEnum.PROJECT_ADMIN,
        ]),
        deleteTask,
    );

tasksRouter
    .route("/:projectId/t/:taskId/subtasks")
    .post(
        validateProjectPermission([
            UserRolesEnum.ADMIN,
            UserRolesEnum.PROJECT_ADMIN,
        ]),
        createSubTask,
    );
tasksRouter
    .route("/:projectId/st/:subTaskId")
    .put(updateSubTask)
    .delete(
        validateProjectPermission([
            UserRolesEnum.ADMIN,
            UserRolesEnum.PROJECT_ADMIN,
        ]),
        deleteSubTask,
    );
export default tasksRouter;
