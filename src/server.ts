import "dotenv/config";
import connectDB from "./db/index";
import app from "./app";

const PORT = process.env.PORT || 3000;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server listening on ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Mongodb connection error", err);
        process.exit(1);
    });
