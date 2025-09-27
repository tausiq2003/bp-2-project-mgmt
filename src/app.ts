import express, { type Response } from "express";
import cors from "cors";
import healthCheckRouter from "./routes/healthcheck.routes";
import authRouter from "./routes/auth.routes";
import cookieParser from "cookie-parser";
import projectRouter from "./routes/project.routes";
import ApiError from "./utils/api-error";
import type { AuthenticatedRequest } from "./types/usertype";

const app = express();

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
// doesnt needs to be here, cuz no frontend
app.use(
    cors({
        origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    }),
);

app.use("/api/v1/healthcheck", healthCheckRouter);
app.use("/api/v1/projects", projectRouter);
app.use("/api/v1/auth", authRouter);
app.use((err: Error, _req: AuthenticatedRequest, res: Response) => {
    let error = err;
    if (!(error instanceof ApiError)) {
        const errorWithStatus = error as Error & { statusCode?: number };
        const statusCode = errorWithStatus.statusCode || 500;
        const message = error.message || "Something went wrong";
        error = new ApiError(statusCode, message, [], err.stack);
    }

    const apiError = error as ApiError<unknown>;

    return res.status(apiError.statusCode).json({
        success: false,
        message: error.message,
        errors: apiError.errors,
        ...(process.env.NODE_ENV === "development" && {
            stack: error.stack,
        }),
    });
});
export default app;
