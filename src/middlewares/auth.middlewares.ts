import { User } from "../models/user.models";
import ApiError from "../utils/api-error";
import asyncHandler from "../utils/async-handler";
import jwt, { type JwtPayload } from "jsonwebtoken";

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
            "-password -refreshToken -emailVerificationToken -emailVerifcationExpiry -role -requestCount",
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
