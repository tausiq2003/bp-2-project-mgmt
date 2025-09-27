import mongoose, { Document, Schema } from "mongoose";
import { AvailableUserRole, UserRolesEnum } from "../types/usertype";

interface ProjectMemberDocument extends Document {
    _id: Schema.Types.ObjectId;
    user: Schema.Types.ObjectId;
    project: Schema.Types.ObjectId;
    role: {
        type: StringConstructor;
        enum: UserRolesEnum[];
        default: UserRolesEnum;
    };
}
const projectMemberSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        project: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        role: {
            type: String,
            enum: AvailableUserRole,
            default: UserRolesEnum.MEMBER,
        },
    },
    { timestamps: true },
);

export const ProjectMember = mongoose.model<ProjectMemberDocument>(
    "ProjectMember",
    projectMemberSchema,
);
