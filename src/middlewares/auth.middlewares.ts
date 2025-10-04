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
            "-password -refreshToken -emailVerificationToken -emailVerifcationExpiry",
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
    asyncHandler(async (req, _res, next) => {
        const { projectId } = req.params;

        if (!req.user) {
            throw new ApiError(401, "Unauthorized request");
        }
        if (!projectId) {
            throw new ApiError(400, "project id is missing");
        }
        if (req.user.role === UserRolesEnum.ADMIN) {
            next();
        }

        const project = await ProjectMember.findOne({
            project: new mongoose.Types.ObjectId(projectId),
            user: new mongoose.Types.ObjectId(`${req.user._id}`),
        });

        if (!project) {
            throw new ApiError(400, "project not found");
        }

        const givenRole = project.role;

        if (!roles.includes(givenRole)) {
            throw new ApiError(
                403,
                "You do not have permission to perform this action",
            );
        }
        req.user.role = givenRole;

        next();
    });
};
