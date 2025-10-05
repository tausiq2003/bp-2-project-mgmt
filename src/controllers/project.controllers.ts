import mongoose, { isValidObjectId } from "mongoose";
import { ProjectMember } from "../models/projectmember.models";
import asyncHandler from "../utils/async-handler";
import ApiError from "../utils/api-error";
import validatePayload from "../utils/validation";
import { projectDetailsValidator } from "../validators/project.validators";
import { Project } from "../models/project.models";
import { UserRolesEnum } from "../types/usertype";
import ApiResponse from "../utils/api-response";
import { User } from "../models/user.models";

export const getProjects = asyncHandler(async function (req, res) {
    // get all user projects, list them
    if (!req.user) {
        throw new ApiError(401, "Unauthorized request");
    }
    const projects = await ProjectMember.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(`${req.user._id}`),
            },
        },
        {
            $lookup: {
                from: "projects",
                localField: "project",
                foreignField: "_id",
                as: "projectDetails",
            },
        },
        {
            $unwind: "$projectDetails",
        },
        {
            $project: {
                _id: 1,
                role: 1,
                "projectDetails._id": 1,
                "projectDetails.name": 1,
                "projectDetails.description": 1,
                "projectDetails.createdBy": 1,
                "projectDetails.createdAt": 1,
            },
        },
    ]);
    return res
        .status(200)
        .json(new ApiResponse(200, projects, "Projects fetched successfully"));
});
export const createProject = asyncHandler(async function (req, res) {
    //need to do transaction:
    //without transaction code will be like:
    //Project.create........
    //
    //ProjectMember.create(project._id, ....., projectadmin)
    // if this creation failed then we have to delete the project document
    //
    // so that will be 3 ops
    // if we use transaction it will be 2 ops
    //
    // create create and succeed or fail
    const userId = req.user?._id;
    if (!userId) {
        throw new ApiError(401, "Unauthorized request");
    }
    const validationData = await validatePayload(
        projectDetailsValidator,
        req.body,
    );
    if ("error" in validationData) {
        throw new ApiError(400, "Validation failed", validationData.error);
    }
    const { name, description } = validationData;
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const project = await Project.create(
            [
                {
                    name,
                    description,
                    createdBy: req.user?._id,
                },
            ],
            { session },
        );
        if (!project[0] || project.length === 0) {
            throw new ApiError(500, "Can't create resource");
        }
        const projectId = project[0]._id;
        const projectmember = await ProjectMember.create(
            [
                {
                    user: req.user?._id,
                    project: projectId,
                    role: UserRolesEnum.PROJECT_ADMIN,
                },
            ],
            { session },
        );
        if (!projectmember[0] || projectmember.length === 0) {
            throw new ApiError(500, "Can't create project member");
        }
        await session.commitTransaction();
        const projectDetails = await ProjectMember.findOne({
            _id: projectmember[0]._id,
        }).populate("project", "name description");
        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    projectDetails,
                    "Project created successfully",
                ),
            );
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }
});
export const getProjectById = asyncHandler(async function (req, res) {
    const { projectId } = req.params;
    if (!isValidObjectId(projectId)) {
        throw new ApiError(400, "Not valid project id");
    }
    const result = await Project.findById(projectId);
    if (!result) {
        throw new ApiError(404, "No projects found");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, result, "Project fetched successfully"));
});
export const updateProject = asyncHandler(async function (req, res) {
    const { projectId } = req.params;
    if (!isValidObjectId(projectId)) {
        throw new ApiError(400, "Not valid project id");
    }
    const validationData = await validatePayload(
        projectDetailsValidator,
        req.body,
    );
    if ("error" in validationData) {
        throw new ApiError(400, "Validation failed", validationData.error);
    }
    const { name, description } = validationData;
    const existingProject = await Project.findByIdAndUpdate(
        projectId,
        {
            name,
            description,
        },
        { new: true },
    );
    if (!existingProject) {
        throw new ApiError(404, "Project not found");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                existingProject,
                "Project updated successfully",
            ),
        );
});
export const deleteProject = asyncHandler(async function (req, res) {
    const { projectId } = req.params;
    if (!isValidObjectId(projectId)) {
        throw new ApiError(400, "Not valid project id");
    }
    //transaction again
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const deletedProject = await Project.findByIdAndDelete(projectId, {
            session,
        });
        if (!deletedProject) {
            throw new ApiError(404, "Project not found");
        }
        const deletedMembers = await ProjectMember.deleteMany(
            {
                project: projectId,
            },
            { session },
        );
        if (deletedMembers.deletedCount === 0) {
            throw new ApiError(500, "Deletion failed");
        }
        await session.commitTransaction();
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {},
                    "Projects and Project Members deleted successfully",
                ),
            );
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        await session.endSession();
    }
});
export const getProjectMembers = asyncHandler(async function (req, res) {
    const { projectId } = req.params;
    if (!isValidObjectId(projectId)) {
        throw new ApiError(400, "Not valid project id");
    }
    const result = await ProjectMember.find({ project: projectId }).populate(
        "user",
        "username",
    );
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                result,
                "Project members fetched successfully",
            ),
        );
});
export const addMembersToProject = asyncHandler(async function (req, res) {
    const { projectId } = req.params;
    const { userId } = req.body;

    if (!isValidObjectId(projectId)) {
        throw new ApiError(400, "Not valid project id");
    }
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Not valid user id");
    }
    const existingUser = await User.findById(userId);
    if (!existingUser) {
        throw new ApiError(404, "User not found");
    }
    const existingProject = await Project.findById(projectId);
    if (!existingProject) {
        throw new ApiError(404, "Project not found");
    }
    const projectMember = await ProjectMember.create({
        project: projectId,
        user: userId,
        role: UserRolesEnum.MEMBER,
    });
    if (!projectMember) {
        throw new ApiError(500, "Creation of project member failed");
    }
    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                projectMember,
                "Project Member added successfully",
            ),
        );
});
export const updateMemberRole = asyncHandler(async function (req, res) {
    //promote to project admin if its member
    // demote to member if its project admin
    const { projectId, userId } = req.params;

    if (!isValidObjectId(projectId)) {
        throw new ApiError(400, "Not valid project id");
    }
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Not valid user id");
    }
    const existingMember = await ProjectMember.findOne({
        project: projectId,
        user: userId,
    });
    if (!existingMember) {
        throw new ApiError(404, "project member not found");
    }
    let newRole: UserRolesEnum;
    const currentRole = existingMember.role;
    if (currentRole === UserRolesEnum.MEMBER) {
        newRole = UserRolesEnum.PROJECT_ADMIN;
        existingMember.role = newRole;
        await existingMember.save();
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    existingMember,
                    "role updated successfully",
                ),
            );
    } else if (currentRole === UserRolesEnum.PROJECT_ADMIN) {
        newRole = UserRolesEnum.MEMBER;
        existingMember.role = newRole;
        await existingMember.save();
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    existingMember,
                    "role updated successfully",
                ),
            );
    }
    throw new ApiError(404, "User role not found");
});
export const deleteMember = asyncHandler(async function (req, res) {
    const { projectId, userId } = req.params;

    if (!isValidObjectId(projectId)) {
        throw new ApiError(400, "Not valid project id");
    }
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Not valid user id");
    }
    const deletedResult = await ProjectMember.deleteOne({
        project: projectId,
        user: userId,
    });
    if (deletedResult.deletedCount === 0) {
        throw new ApiError(
            404,
            "Server problem or project id or user id not found",
        );
    }
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Project member deleted successfully"));
});
