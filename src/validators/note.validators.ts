import z from "zod";

export const noteDetailsValidator = z.object({
    title: z
        .string()
        .min(5, { message: "Title must be atleast 5 characters" })
        .max(50, {
            message: "Title must be atmost 50 characters",
        }),
    content: z
        .string()
        .max(1000, { message: "Description must be atmost 1000 characters" }),
});
