import mongoose from "mongoose";

export default async function connectDB() {
    try {
        const mongoURL = process.env.MONGO_URL!;
        if (!mongoURL) {
            console.error("Mongo url not found");
            process.exit(1);
        }
        await mongoose.connect(mongoURL);
        console.log("MongoDB CONNECTED");
    } catch (error) {
        console.error("MongoDB connection error", error);
        process.exit(1);
    }
}
