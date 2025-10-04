import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";
import { createHash, randomBytes } from "crypto";
import { AvailableUserRole, UserRolesEnum } from "../types/usertype";

export interface UserDocument extends Document {
    _id: Schema.Types.ObjectId;
    username: string;
    avatar: string;
    email: string;
    fullName?: string;
    password: string;
    isEmailVerified: boolean;
    refreshToken?: string;
    forgotPasswordToken?: string | undefined;
    forgotPasswordExpiry?: Date | undefined;
    emailVerificationToken?: string | undefined;
    emailVerificationExpiry?: Date | undefined;
    role: UserRolesEnum;

    isPasswordCorrect(password: string): Promise<boolean>;
    generateAccessToken(): string;
    generateRefreshToken(): string;
    generateTemporaryToken(): {
        unHashedToken: string;
        hashedToken: string;
        tokenExpiry: number;
    };
}

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        avatar: {
            type: String,
            required: true,
            default: "https://placehold.co/100",
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        refreshToken: {
            type: String,
        },
        forgotPasswordToken: {
            type: String,
        },
        forgotPasswordExpiry: {
            type: Date,
        },
        emailVerificationToken: {
            type: String,
        },
        emailVerificationExpiry: {
            type: Date,
        },
        role: {
            type: String,
            enum: AvailableUserRole,
            default: UserRolesEnum.NORMAL,
        },
    },
    { timestamps: true },
);
userSchema.pre("save", async function (next) {
    //because it will run everytime something is changed, so isModified
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.isPasswordCorrect = async function (password: string) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
        },
        process.env.ACCESS_TOKEN_SECRET! as string,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m" } as SignOptions,
    );
};
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET! as string,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "10d" } as SignOptions,
    );
};

userSchema.methods.generateTemporaryToken = function () {
    const unHashedToken = randomBytes(20).toString("hex");
    const hashedToken = createHash("sha256")
        .update(unHashedToken)
        .digest("hex");
    const tokenExpiry = Date.now() + 20 * 60 * 1000;
    return { unHashedToken, hashedToken, tokenExpiry };
};

export const User = mongoose.model<UserDocument>("user", userSchema);
