import mongoose, { Document, Schema } from "mongoose";

interface NoteDocument extends Document {
    _id: Schema.Types.ObjectId;
    project: Schema.Types.ObjectId;
    createdBy: Schema.Types.ObjectId;
    title: string;
    content: string;
}

const projectNoteSchema = new Schema(
    {
        project: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
    },
    { timestamps: true },
);

export const ProjectNote = mongoose.model<NoteDocument>(
    "ProjectNote",
    projectNoteSchema,
);
