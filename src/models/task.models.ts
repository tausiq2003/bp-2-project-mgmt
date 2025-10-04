import mongoose, { Document, Schema } from "mongoose";
import { AvailableTaskStatues, TaskStatusEnum } from "../types/usertype";

interface TaskDocument extends Document {
    _id: Schema.Types.ObjectId;
    title: string;
    description: string;
    project: Schema.Types.ObjectId;
    assignedTo: Schema.Types.ObjectId;
    assignedBy: Schema.Types.ObjectId;
    status: {
        type: StringConstructor;
        enum: TaskStatusEnum[];
        default: TaskStatusEnum;
    };
    attachments: {
        type: {
            url: StringConstructor;
            mimetype: StringConstructor;
            size: NumberConstructor;
        }[];
        default: never[];
    };
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
        attachments: {
            type: [
                {
                    url: String,
                    mimetype: String,
                    size: Number,
                },
            ],
            default: [],
        },
    },
    { timestamps: true },
);

export const Taks = mongoose.model<TaskDocument>("Task", taskSchema);
