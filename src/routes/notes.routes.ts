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
import { AvailableUserRole, UserRolesEnum } from "../types/usertype";

const notesRouter = Router();
notesRouter.use(verifyJwt);

notesRouter
    .route("/:projectId")
    .get(listProjectNotes)
    .post(validateProjectPermission([UserRolesEnum.ADMIN]), createProjectNote);

notesRouter
    .route("/:projectId/n/:noteId")
    .get(getNoteDetails)
    .put(validateProjectPermission([UserRolesEnum.ADMIN]), updateNote)
    .delete(validateProjectPermission([UserRolesEnum.ADMIN]), deleteNote);

export default notesRouter;
