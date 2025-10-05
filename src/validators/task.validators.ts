import z from "zod";
import { AvailableTaskStatues } from "../types/usertype";

export const taskDetailsValidator = z.object({
    title: z
        .string()
        .min(5, { message: "Title must be atleast 5 characters" })
        .max(100, {
            message: "Title must be atmost 100 characters",
        }),
    description: z
        .string()
        .min(10, { message: "Description must be atleast 10 characters" })
        .max(2000, { message: "Description must be atmost 2000 characters" }),
    assignedTo: z.string().optional(),
});

export const taskUpdateDetailsValidator = z.object({
    title: z
        .string()
        .min(5, { message: "Title must be atleast 5 characters" })
        .max(100, {
            message: "Title must be atmost 100 characters",
        })
        .optional(),
    description: z
        .string()
        .min(10, { message: "Description must be atleast 10 characters" })
        .max(2000, { message: "Description must be atmost 2000 characters" })
        .optional(),
    assignedTo: z.string().optional(),
    status: z.enum(AvailableTaskStatues as [string, ...string[]]).optional(),
});
