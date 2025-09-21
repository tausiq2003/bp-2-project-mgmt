import { Router } from "express";
import {
    registerUserController,
    loginUserController,
    logoutUserController,
} from "../controllers/auth.controllers";
import { verifyJwt } from "../middlewares/auth.middlewares";

const authRouter = Router();

authRouter.route("/register").post(registerUserController);
authRouter.route("/login").post(loginUserController);
authRouter.route("/logout").post(verifyJwt, logoutUserController);

export default authRouter;
