import mongoose, { isValidObjectId } from "mongoose";
import asyncHandler from "../utils/async-handler";
import ApiError from "../utils/api-error";
import { Task } from "../models/task.models";
import ApiResponse from "../utils/api-response";
import { Subtask } from "../models/subtask.models";
import validatePayload from "../utils/validation";
import {
    subtaskDetailsValidator,
    subtaskUpdateDetailsValidator,
} from "../validators/subtask.validators";
import {
    taskDetailsValidator,
    taskUpdateDetailsValidator,
} from "../validators/task.validators";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary";

export const listProjectTasks = asyncHandler(async function (req, res) {
    const { projectId } = req.params;
    if (!isValidObjectId(projectId)) {
        throw new ApiError(400, "Project Id not valid");
    }
    const tasks = await Task.find({ project: projectId });
    if (tasks.length === 0) {
        throw new ApiError(404, "No tasks found");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, tasks, "Tasks fetched successfully"));
});

export const createProjectTask = asyncHandler(async function (req, res) {
    const { projectId } = req.params;

    if (!isValidObjectId(projectId)) {
        throw new ApiError(400, "Project Id not valid");
    }

    const validationData = await validatePayload(
        taskDetailsValidator,
        req.body,
    );
    if ("error" in validationData) {
        throw new ApiError(400, "Validation failed", validationData.error);
    }

    const { title, description, assignedTo } = validationData;

    // Handle file uploads (markdown files only)
    const attachments: { url: string; mimetype: string; size: number }[] = [];

    if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
            // Validate mimetype is markdown
            if (
                file.mimetype !== "text/markdown" &&
                file.mimetype !== "text/x-markdown"
            ) {
                throw new ApiError(
                    400,
                    `File ${file.originalname} is not a markdown file`,
                );
            }

            // Upload to cloudinary
            const uploadResult = await uploadOnCloudinary(file.path);
            if (!uploadResult) {
                throw new ApiError(
                    500,
                    `Failed to upload file ${file.originalname}`,
                );
            }

            attachments.push({
                url: uploadResult.secure_url,
                mimetype: file.mimetype,
                size: file.size,
            });
        }
    }

    const createdTask = await Task.create({
        title,
        description,
        project: projectId,
        assignedTo: assignedTo || null,
        assignedBy: req.user?._id,
        attachments,
    });

    if (!createdTask) {
        throw new ApiError(500, "Can't create task");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, createdTask, "Task created successfully"));
});

export const getTaskDetails = asyncHandler(async function (req, res) {
    const { taskId } = req.params;

    const task = await Task.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(taskId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "assignedTo",
                foreignField: "_id",
                as: "assignedTo",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        {
            $lookup: {
                from: "subtasks",
                localField: "_id",
                foreignField: "task",
                as: "subtasks",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "createdBy",
                            foreignField: "_id",
                            as: "createdBy",
                            pipeline: [
                                {
                                    $project: {
                                        _id: 1,
                                        username: 1,
                                        fullName: 1,
                                        avatar: 1,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $addFields: {
                            createdBy: {
                                $arrayElemAt: ["$createdBy", 0],
                            },
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                assignedTo: {
                    $arrayElemAt: ["$assignedTo", 0],
                },
            },
        },
    ]);

    if (!task || task.length === 0) {
        throw new ApiError(404, "Task not found");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, task[0], "Task fetched successfully"));
});

export const updateTask = asyncHandler(async function (req, res) {
    const { projectId, taskId } = req.params;

    if (!isValidObjectId(projectId)) {
        throw new ApiError(400, "Project Id not valid");
    }

    if (!isValidObjectId(taskId)) {
        throw new ApiError(400, "Task Id not valid");
    }

    const validationData = await validatePayload(
        taskUpdateDetailsValidator,
        req.body,
    );
    if ("error" in validationData) {
        throw new ApiError(400, "Validation failed", validationData.error);
    }

    const { title, description, assignedTo, status } = validationData;

    // Get existing task to check attachments
    const existingTask = await Task.findOne({
        _id: taskId,
        project: projectId,
    });
    if (!existingTask) {
        throw new ApiError(404, "Task not found");
    }

    // Handle new file uploads (markdown files only)
    const newAttachments: { url: string; mimetype: string; size: number }[] =
        [];

    if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
            // Validate mimetype is markdown
            if (
                file.mimetype !== "text/markdown" &&
                file.mimetype !== "text/x-markdown"
            ) {
                throw new ApiError(
                    400,
                    `File ${file.originalname} is not a markdown file`,
                );
            }

            // Upload to cloudinary
            const uploadResult = await uploadOnCloudinary(file.path);
            if (!uploadResult) {
                throw new ApiError(
                    500,
                    `Failed to upload file ${file.originalname}`,
                );
            }

            newAttachments.push({
                url: uploadResult.secure_url,
                mimetype: file.mimetype,
                size: file.size,
            });
        }
    }

    const updateData: {
        title?: string;
        description?: string;
        assignedTo?: string;
        status?: string;
        attachments?: { url: string; mimetype: string; size: number }[];
    } = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (status) updateData.status = status;
    if (newAttachments.length > 0) {
        updateData.attachments = [
            ...existingTask.attachments,
            ...newAttachments,
        ];
    }

    const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        { $set: updateData },
        { new: true },
    );

    if (!updatedTask) {
        throw new ApiError(404, "Task not found or update failed");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedTask, "Task updated successfully"));
});

export const deleteTask = asyncHandler(async function (req, res) {
    const { projectId, taskId } = req.params;
    if (!isValidObjectId(projectId)) {
        throw new ApiError(400, "Project Id not valid");
    }

    if (!isValidObjectId(taskId)) {
        throw new ApiError(400, "Task Id not valid");
    }

    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        // Get task to delete attachments from cloudinary
        const task = await Task.findOne({ _id: taskId, project: projectId });
        if (!task) {
            throw new ApiError(404, "Task not found");
        }

        // Delete all attachments from cloudinary
        if (task.attachments && task.attachments.length > 0) {
            for (const attachment of task.attachments) {
                await deleteFromCloudinary(attachment.url, "raw");
            }
        }

        const deletedItem = await Task.deleteOne({
            _id: taskId,
            project: projectId,
        });
        if (deletedItem.deletedCount === 0) {
            throw new ApiError(404, "Task deletion failed");
        }

        await Subtask.deleteMany({ task: taskId });

        await session.commitTransaction();
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Task deleted successfully"));
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }
});

export const createSubTask = asyncHandler(async function (req, res) {
    const { projectId, taskId } = req.params;

    if (!isValidObjectId(projectId)) {
        throw new ApiError(400, "Project Id not valid");
    }

    if (!isValidObjectId(taskId)) {
        throw new ApiError(400, "Task Id not valid");
    }
    const task = await Task.findOne({ _id: taskId, project: projectId });
    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    const validationData = await validatePayload(
        subtaskDetailsValidator,
        req.body,
    );
    if ("error" in validationData) {
        throw new ApiError(400, "Validation failed", validationData.error);
    }
    const { title, description } = validationData;
    const createdSubTask = await Subtask.create({
        title: title,
        description: description,
        task: taskId,
        createdBy: req.user?._id,
    });
    if (!createdSubTask) {
        throw new ApiError(500, "Can't create subtask");
    }
    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                createdSubTask,
                "Subtask created successfully",
            ),
        );
});

export const updateSubTask = asyncHandler(async function (req, res) {
    const { projectId, subTaskId } = req.params;
    if (!isValidObjectId(projectId)) {
        throw new ApiError(400, "Project Id not valid");
    }

    if (!isValidObjectId(subTaskId)) {
        throw new ApiError(400, "Sub task Id not valid");
    }

    const validationData = await validatePayload(
        subtaskUpdateDetailsValidator,
        req.body,
    );
    if ("error" in validationData) {
        throw new ApiError(400, "Validation failed", validationData.error);
    }

    const { title, description, completed } = validationData;

    const updateData: {
        title?: string;
        description?: string;
        isCompleted?: boolean;
    } = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (completed !== undefined) updateData.isCompleted = completed;

    const subTaskUpdate = await Subtask.findByIdAndUpdate(
        subTaskId,
        { $set: updateData },
        { new: true },
    );

    if (!subTaskUpdate) {
        throw new ApiError(404, "subtask not found or updation failed");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, subTaskUpdate, "Subtask updated successfully"),
        );
});

export const deleteSubTask = asyncHandler(async function (req, res) {
    const { projectId, subTaskId } = req.params;
    if (!isValidObjectId(projectId)) {
        throw new ApiError(400, "Project Id not valid");
    }

    if (!isValidObjectId(subTaskId)) {
        throw new ApiError(400, "Sub task Id not valid");
    }
    const deletedItem = await Subtask.findByIdAndDelete(subTaskId);
    if (!deletedItem) {
        throw new ApiError(404, "subtask not found or deletion failed");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, deletedItem, "Subtask deleted successfully"),
        );
});
