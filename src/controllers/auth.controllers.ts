import { asyncWrapProviders } from "async_hooks";
import { User } from "../models/user.models";
import ApiError from "../utils/api-error";
import ApiResponse from "../utils/api-response";
import asyncHandler from "../utils/async-handler";
import {
    emailVerificationMailgenContent,
    forgotPasswordMailgenContent,
    sendEmail,
} from "../utils/mail";
import {
    cPValidator,
    fpRValidator,
    fpValidator,
    loginValidator,
    registerValidator,
} from "../validators/auth.validators";
import { createHash } from "crypto";
import jwt from "jsonwebtoken";

async function generateAccessAndRefreshTokens(userId: string) {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(401, "User not found");
        }
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        if (!user) {
            throw new ApiError(404, "User not found");
        }
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (err) {
        console.error(err);
        throw new ApiError(
            500,
            "Something went wrong while generating access and refresh tokens",
        );
    }
}

export const registerUserController = asyncHandler(async function (req, res) {
    const validationResult = await registerValidator.safeParseAsync(req.body);
    if (!validationResult.success) {
        const prettyErrors = validationResult.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
            code: issue.code,
        }));
        const errorMessages = prettyErrors.map(
            (error) => `${error.field}: ${error.message} (Code: ${error.code})`,
        );
        throw new ApiError(400, "Validation failed", errorMessages);
    }
    const validationData = validationResult.data;
    const { email, password, username } = validationData;

    const existedUser = await User.findOne({ $or: [{ username }, { email }] });

    if (existedUser) {
        throw new ApiError(409, "User with email or username exists.");
    }
    const user = await User.create({
        email,
        password,
        username,
        isEmailVerified: false,
    });
    const { unHashedToken, hashedToken, tokenExpiry } =
        user.generateTemporaryToken();
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry as unknown as Date;
    await user.save({ validateBeforeSave: false });
    await sendEmail({
        email: user?.email,
        subject: "Please verify your email",
        mailgenContent: emailVerificationMailgenContent(
            user.username,
            `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`,
        ),
    });
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
    );
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user");
    }
    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                { user: createdUser },
                "User registered successfully and verification email has sent succesfully",
            ),
        );
});

export const loginUserController = asyncHandler(async function (req, res) {
    const validationResult = await loginValidator.safeParseAsync(req.body);
    if (!validationResult.success) {
        const prettyErrors = validationResult.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
            code: issue.code,
        }));
        const errorMessages = prettyErrors.map(
            (error) => `${error.field}: ${error.message} (Code: ${error.code})`,
        );
        throw new ApiError(400, "Validation failed", errorMessages);
    }
    const validationData = validationResult.data;
    const { email, password } = validationData;
    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(400, "user doesn't exist");
    }
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(400, "Invalid credientials");
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
        user._id,
    );
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
    );
    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "strict" as const,
    };
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { user: loggedInUser },
                "user logged in successfully",
            ),
        );
});
export const logoutUserController = asyncHandler(async function (req, res) {
    await User.findByIdAndUpdate(
        req.user?._id,
        { $set: { refreshToken: "" } },
        { new: true },
    );
    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "strict" as const,
    };
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out"));
});
export const getCurrentUser = asyncHandler(async function (req, res) {
    return res
        .status(200)
        .json(
            new ApiResponse(200, req.user, "Current user fetched successfully"),
        );
});

export const verifyEmail = asyncHandler(async function (req, res) {
    const { verificationToken } = req.params;
    if (!verificationToken) {
        throw new ApiError(400, "Email verification token is missing");
    }
    const hashedToken = createHash("sha256")
        .update(verificationToken)
        .digest("hex");
    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpiry: { $gt: Date.now() },
    });
    if (!user) {
        throw new ApiError(400, "Token is invalid or expired");
    }
    user.emailVerificationExpiry = undefined;
    user.emailVerificationToken = undefined;
    user.isEmailVerified = true;
    await user.save({ validateBeforeSave: false });
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { isEmailVerified: true },
                "Email is verified",
            ),
        );
});

export const resendEmailVerification = asyncHandler(async function (req, res) {
    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(404, "user does not exist");
    }
    if (user.isEmailVerified) {
        throw new ApiError(409, "Email is already verified");
    }
    const { unHashedToken, hashedToken, tokenExpiry } =
        user.generateTemporaryToken();
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry as unknown as Date;
    await user.save({ validateBeforeSave: false });
    await sendEmail({
        email: user?.email,
        subject: "Please verify your email",
        mailgenContent: emailVerificationMailgenContent(
            user.username,
            `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`,
        ),
    });
    return res.status(200).json(new ApiResponse(200, {}, "Mail has been sent"));
});

export const refreshAccessToken = asyncHandler(async function (req, res) {
    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET! as string,
        );
        const user = await User.findById(decodedToken?._id);
        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired");
        }
        const options = {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
        };
        const { accessToken, refreshToken: newRefreshToken } =
            await generateAccessAndRefreshTokens(user._id);
        user.refreshToken = newRefreshToken;
        await user.save({ validateBeforeSave: false });
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed",
                ),
            );
    } catch (error) {
        console.error(error);
        throw new ApiError(401, "Invalid refresh token");
    }
});
export const forgotPasswordRequest = asyncHandler(async function (req, res) {
    const validationResult = await fpValidator.safeParseAsync(req.body);
    if (!validationResult.success) {
        const prettyErrors = validationResult.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
            code: issue.code,
        }));
        const errorMessages = prettyErrors.map(
            (error) => `${error.field}: ${error.message} (Code: ${error.code})`,
        );
        throw new ApiError(400, "Validation failed", errorMessages);
    }
    const validationData = validationResult.data;
    const { email } = validationData;
    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User doesnt exist");
    }
    const { unHashedToken, hashedToken, tokenExpiry } =
        user.generateTemporaryToken();
    user.forgotPasswordToken = hashedToken;
    user.forgotPasswordExpiry = tokenExpiry as unknown as Date;
    await user.save({ validateBeforeSave: false });
    await sendEmail({
        email: user?.email,
        subject: "Password reset",
        mailgenContent: forgotPasswordMailgenContent(
            user.username,
            `${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${unHashedToken}`,
        ),
    });
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password reset mail has been sent on your mail",
            ),
        );
});

export const resetForgotPassword = asyncHandler(async function (req, res) {
    const { resetToken } = req.params;
    const validationResult = await fpRValidator.safeParseAsync(req.body);
    if (!validationResult.success) {
        const prettyErrors = validationResult.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
            code: issue.code,
        }));
        const errorMessages = prettyErrors.map(
            (error) => `${error.field}: ${error.message} (Code: ${error.code})`,
        );
        throw new ApiError(400, "Validation failed", errorMessages);
    }
    const validationData = validationResult.data;
    const { newPassword } = validationData;
    const hashedToken = createHash("sha256").update(resetToken).digest("hex");
    const user = await User.findOne({
        forgotPasswordToken: hashedToken,
        forgotPasswordExpiry: { $gt: Date.now() },
    });
    if (!user) {
        throw new ApiError(489, "Token is invalid or expired");
    }
    user.forgotPasswordExpiry = undefined;
    user.forgotPasswordToken = undefined;

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password reset successfully"));
});
export const changeCurrentPassword = asyncHandler(async function (req, res) {
    const validationResult = await cPValidator.safeParseAsync(req.body);
    if (!validationResult.success) {
        const prettyErrors = validationResult.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
            code: issue.code,
        }));
        const errorMessages = prettyErrors.map(
            (error) => `${error.field}: ${error.message} (Code: ${error.code})`,
        );
        throw new ApiError(400, "Validation failed", errorMessages);
    }
    const validationData = validationResult.data;
    const { oldPassword, newPassword } = validationData;
    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(404, "user not found");
    }
    const isPasswordValid = await user?.isPasswordCorrect(oldPassword);
    if (!isPasswordValid) {
        throw new ApiError(400, "Invalid old password");
    }
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"));
});
