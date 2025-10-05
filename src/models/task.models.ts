import mongoose, { Document, Schema } from "mongoose";
import { AvailableTaskStatues, TaskStatusEnum } from "../types/usertype";

interface TaskDocument extends Document {
    _id: Schema.Types.ObjectId;
    title: string;
    description: string;
    project: Schema.Types.ObjectId;
    assignedTo: Schema.Types.ObjectId;
    assignedBy: Schema.Types.ObjectId;
    status: TaskStatusEnum;
    attachments: {
        url: string;
        mimetype: string;
        size: number;
    }[];
}
const taskSchema = new Schema(
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
        project: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        assignedTo: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        assignedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        status: {
            type: String,
            enum: AvailableTaskStatues,
            default: TaskStatusEnum.TODO,
        },
        attachments: [
            {
                url: {
                    type: String,
                    required: true,
                },
                mimetype: {
                    type: String,
                    required: true,
                    validate: {
                        validator: function (v: string) {
                            return (
                                v === "text/markdown" || v === "text/x-markdown"
                            );
                        },
                        message: "Only markdown files are allowed",
                    },
                },
                size: {
                    type: Number,
                    required: true,
                },
            },
        ],
    },
    { timestamps: true },
);

export const Task = mongoose.model<TaskDocument>("Task", taskSchema);
