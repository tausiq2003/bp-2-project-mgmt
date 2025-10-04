import z from "zod";

export const projectDetailsValidator = z.object({
    name: z
        .string()
        .min(5, { message: "Name must be atleast 5 characters" })
        .max(50, {
            message: "Name must be atmost 50 characters",
        }),

    description: z
        .string()
        .max(2000, { message: "Description must be atmost 2000 characters" }),
});
