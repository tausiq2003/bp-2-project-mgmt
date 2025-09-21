import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../types/usertype.ts";

type RequestHandlerWithAuth = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
) => Promise<unknown> | void;

function asyncHandler(requestHandler: RequestHandlerWithAuth) {
    return function (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction,
    ) {
        Promise.resolve(requestHandler(req, res, next)).catch((err) =>
            next(err),
        );
    };
}
export default asyncHandler;
