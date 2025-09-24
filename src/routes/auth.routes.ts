import { Router } from "express";
import {
    registerUserController,
    loginUserController,
    logoutUserController,
    verifyEmail,
    refreshAccessToken,
    forgotPasswordRequest,
    resetForgotPassword,
    getCurrentUser,
    changeCurrentPassword,
    resendEmailVerification,
} from "../controllers/auth.controllers";
import { verifyJwt } from "../middlewares/auth.middlewares";

const authRouter = Router();

authRouter.route("/register").post(registerUserController);
authRouter.route("/login").post(loginUserController);
authRouter.route("/verify-email/:verificationToken").get(verifyEmail);
authRouter.route("/refresh-token").post(refreshAccessToken);
authRouter.route("/forgot-password").post(forgotPasswordRequest);
authRouter.route("/reset-password/:resetToken").post(resetForgotPassword);

//secure routes
authRouter.route("/logout").post(verifyJwt, logoutUserController);
authRouter.route("/current-user").post(verifyJwt, getCurrentUser);
authRouter.route("/change-password").post(verifyJwt, changeCurrentPassword);
authRouter
    .route("/resend-email-verification")
    .post(verifyJwt, resendEmailVerification);

export default authRouter;
