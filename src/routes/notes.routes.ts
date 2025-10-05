import { Router } from "express";
import {
    listProjectNotes,
    createProjectNote,
    getNoteDetails,
    updateNote,
    deleteNote,
} from "../controllers/notes.controllers";

import {
    verifyJwt,
    validateProjectPermission,
} from "../middlewares/auth.middlewares";
import { UserRolesEnum } from "../types/usertype";

const notesRouter = Router();
notesRouter.use(verifyJwt);

notesRouter
    .route("/:projectId")
    .get(
        validateProjectPermission([
            UserRolesEnum.MEMBER,
            UserRolesEnum.PROJECT_ADMIN,
            UserRolesEnum.ADMIN,
        ]),
        listProjectNotes,
    )
    .post(validateProjectPermission([UserRolesEnum.ADMIN]), createProjectNote);

notesRouter
    .route("/:projectId/n/:noteId")
    .get(
        validateProjectPermission([
            UserRolesEnum.MEMBER,
            UserRolesEnum.PROJECT_ADMIN,
            UserRolesEnum.ADMIN,
        ]),
        getNoteDetails,
    )
    .put(validateProjectPermission([UserRolesEnum.ADMIN]), updateNote)
    .delete(validateProjectPermission([UserRolesEnum.ADMIN]), deleteNote);

export default notesRouter;
