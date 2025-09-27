import z from "zod";

export default async function validatePayload<T extends z.ZodRawShape>(
    validation: z.ZodObject<T, z.core.$strip>,
    payload: unknown,
) {
    const validationResult = await validation.safeParseAsync(payload);
    if (!validationResult.success) {
        const prettyErrors = validationResult.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
            code: issue.code,
        }));
        const errorMessages = prettyErrors.map(
            (error) => `${error.field}: ${error.message} (Code: ${error.code})`,
        );
        console.log(errorMessages);

        // Return errorMessages directly as string array, not wrapped in object
        return { error: errorMessages }; // This should be string[], not string
    }
    const validationData = validationResult.data;
    return validationData;
}
