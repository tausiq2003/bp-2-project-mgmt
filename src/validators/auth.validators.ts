import z from "zod";

export const registerValidator = z.object({
    email: z.email(),
    username: z
        .string()
        .regex(/^[A-Za-z]+$/, "Only alphabetic characters are allowed"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .max(64, "Password must be atmost 64 characters long")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
        .regex(/[0-9]/, "Password must contain at least one number.")
        .regex(
            /[^a-zA-Z0-9]/,
            "Password must contain at least one special character.",
        ),

    fullName: z
        .string()
        .regex(/^[A-Za-z]+$/, "Only alphabetic characters are allowed")
        .optional(),
});
export const loginValidator = z.object({
    email: z.email(),
    username: z
        .string()
        .regex(/^[A-Za-z]+$/, "Only alphabetic characters are allowed"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .max(64, "Password must be atmost 64 characters long")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
        .regex(/[0-9]/, "Password must contain at least one number.")
        .regex(
            /[^a-zA-Z0-9]/,
            "Password must contain at least one special character.",
        ),
});
export const fpValidator = z.object({
    email: z.email(),
});
export const fpRValidator = z.object({
    newPassword: z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .max(64, "Password must be atmost 64 characters long")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
        .regex(/[0-9]/, "Password must contain at least one number.")
        .regex(
            /[^a-zA-Z0-9]/,
            "Password must contain at least one special character.",
        ),
});

export const cPValidator = z
    .object({
        oldPassword: z
            .string()
            .min(8, "Password must be at least 8 characters long")
            .max(64, "Password must be at most 64 characters long")
            .regex(
                /[a-z]/,
                "Password must contain at least one lowercase letter.",
            )
            .regex(
                /[A-Z]/,
                "Password must contain at least one uppercase letter.",
            )
            .regex(/[0-9]/, "Password must contain at least one number.")
            .regex(
                /[^a-zA-Z0-9]/,
                "Password must contain at least one special character.",
            ),
        newPassword: z
            .string()
            .min(8, "Password must be at least 8 characters long")
            .max(64, "Password must be at most 64 characters long")
            .regex(
                /[a-z]/,
                "Password must contain at least one lowercase letter.",
            )
            .regex(
                /[A-Z]/,
                "Password must contain at least one uppercase letter.",
            )
            .regex(/[0-9]/, "Password must contain at least one number.")
            .regex(
                /[^a-zA-Z0-9]/,
                "Password must contain at least one special character.",
            ),
    })
    .refine((data) => data.oldPassword !== data.newPassword, {
        message: "New password is the same as old password",
        path: ["newPassword"],
    });
