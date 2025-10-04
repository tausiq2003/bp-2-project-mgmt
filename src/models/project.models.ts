import mongoose, { Document, Schema } from "mongoose";

interface ProjectDocument extends Document {
    _id: Schema.Types.ObjectId;
    name: string;
    description: string;
    createdBy: Schema.Types.ObjectId;
}

const projectSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true },
);

export const Project = mongoose.model<ProjectDocument>(
    "Project",
    projectSchema,
);
