import mongoose, { Document, Schema } from "mongoose";

interface SubTaskSchemaDocument extends Document {
    _id: Schema.Types.ObjectId;
    title: string;
    description: string;
    task: Schema.Types.ObjectId;
    isCompleted: boolean;
    createdBy: Schema.Types.ObjectId;
}

const subTaskSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
        },
        task: {
            type: Schema.Types.ObjectId,
            ref: "Task",
            required: true,
        },
        isCompleted: {
            type: Boolean,
            default: false,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true },
);

export const Subtask = mongoose.model<SubTaskSchemaDocument>(
    "Subtask",
    subTaskSchema,
);
