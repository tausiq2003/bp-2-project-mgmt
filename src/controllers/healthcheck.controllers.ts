import ApiResponse from "../utils/api-response";
import asyncHandler from "../utils/async-handler";

const healthCheck = asyncHandler(async function (req, res) {
    res.status(200).json(
        new ApiResponse(200, { message: "Server is running" }),
    );
});

export default healthCheck;
