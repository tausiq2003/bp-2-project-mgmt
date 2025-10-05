import { User } from "../models/user.models";
import { ProjectMember } from "../models/projectmember.models";
import ApiError from "../utils/api-error";
import asyncHandler from "../utils/async-handler";
import jwt, { type JwtPayload } from "jsonwebtoken";
import mongoose from "mongoose";
import { UserRolesEnum } from "../types/usertype";

export const verifyJwt = asyncHandler(async (req, _, next) => {
    try {
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }
        const decodedToken = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET! as string,
        ) as JwtPayload;
        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
        );
        if (!user) {
            throw new ApiError(401, "Invalid access token");
        }
        req.user = user;
        next();
    } catch (error) {
        console.error(error);
        throw new ApiError(
            401,
            (error as Error)?.message || "Invalid access token",
        );
    }
});

export const validateProjectPermission = (roles: UserRolesEnum[] = []) => {
    return asyncHandler(async (req, _res, next) => {
        const { projectId } = req.params;

        if (!req.user) {
            throw new ApiError(401, "Unauthorized request");
        }
        if (!projectId) {
            throw new ApiError(400, "Project id is missing");
        }
        if (req.user.role === UserRolesEnum.ADMIN) {
            return next();
        }

        const projectMember = await ProjectMember.findOne({
            project: new mongoose.Types.ObjectId(projectId),
            user: new mongoose.Types.ObjectId(`${req.user._id}`),
        });

        if (!projectMember) {
            throw new ApiError(403, "You are not a member of this project");
        }

        const memberRole = projectMember.role;

        if (!roles.includes(memberRole)) {
            throw new ApiError(
                403,
                "You do not have permission to perform this action",
            );
        }

        // Update user role to project-specific role
        req.user.role = memberRole;
        next();
    });
};
