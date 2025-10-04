import { isValidObjectId } from "mongoose";
import { Project } from "../models/project.models";
import asyncHandler from "../utils/async-handler";
import ApiError from "../utils/api-error";
import { ProjectNote } from "../models/note.models";
import ApiResponse from "../utils/api-response";
import validatePayload from "../utils/validation";
import { noteDetailsValidator } from "../validators/note.validators";

export const listProjectNotes = asyncHandler(async function (req, res) {
    const { projectId } = req.params;
    if (!isValidObjectId(projectId)) {
        throw new ApiError(400, "Project Id not valid");
    }
    const existingProject = await Project.findById(projectId);
    if (!existingProject) {
        throw new ApiError(404, "Project not found");
    }
    const existingNotes = await ProjectNote.find({ project: projectId });
    if (existingNotes.length === 0) {
        throw new ApiError(404, "No notes found");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, existingNotes, "Notes fetched successfully"),
        );
});
export const createProjectNote = asyncHandler(async function (req, res) {
    const { projectId } = req.params;
    if (!isValidObjectId(projectId)) {
        throw new ApiError(400, "Project Id not valid");
    }
    const validationData = await validatePayload(
        noteDetailsValidator,
        req.body,
    );
    if ("error" in validationData) {
        throw new ApiError(400, "Validation failed", validationData.error);
    }
    const { title, content } = validationData;

    const existingProject = await Project.findById(projectId);
    if (!existingProject) {
        throw new ApiError(404, "Project not found");
    }
    const createdProjectNote = await ProjectNote.create({
        project: projectId,
        title: title,
        content: content,
        createdBy: req.user?._id,
    });
    if (!createdProjectNote) {
        throw new ApiError(500, "Note creation failed");
    }
    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                createdProjectNote,
                "Note created successfully",
            ),
        );
});
export const getNoteDetails = asyncHandler(async function (req, res) {
    const { projectId, noteId } = req.params;
    if (!isValidObjectId(projectId)) {
        throw new ApiError(400, "Project Id not valid");
    }
    if (!isValidObjectId(noteId)) {
        throw new ApiError(400, "Note Id not valid");
    }
    const projectNote = await ProjectNote.findOne({
        _id: noteId,
        project: projectId,
    });
    if (!projectNote) {
        throw new ApiError(404, "Note not found");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, projectNote, "Note fetched successfully"));
});
export const updateNote = asyncHandler(async function (req, res) {
    const { projectId, noteId } = req.params;
    if (!isValidObjectId(projectId)) {
        throw new ApiError(400, "Project Id not valid");
    }
    if (!isValidObjectId(noteId)) {
        throw new ApiError(400, "Note Id not valid");
    }
    const validationData = await validatePayload(
        noteDetailsValidator,
        req.body,
    );
    if ("error" in validationData) {
        throw new ApiError(400, "Validation failed", validationData.error);
    }
    const { title, content } = validationData;
    const projectNote = await ProjectNote.findOneAndUpdate(
        {
            _id: noteId,
            project: projectId,
        },
        {
            $set: {
                title: title,
                content: content,
            },
        },
        { new: true },
    );
    if (!projectNote) {
        throw new ApiError(404, "Note not found or updation failed");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, projectNote, "Note updated successfully"));
});
export const deleteNote = asyncHandler(async function (req, res) {
    const { projectId, noteId } = req.params;
    if (!isValidObjectId(projectId)) {
        throw new ApiError(400, "Project Id not valid");
    }
    if (!isValidObjectId(noteId)) {
        throw new ApiError(400, "Note Id not valid");
    }
    const deletedNote = await ProjectNote.deleteOne({
        _id: noteId,
        project: projectId,
    });
    if (deletedNote.deletedCount === 0) {
        throw new ApiError(404, "Note not found or deletion failed");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Project Note deleted successfully"));
});
