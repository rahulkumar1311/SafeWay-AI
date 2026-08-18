import express from "express";
import path from "path";
import { configDotenv } from "dotenv";
import { fileURLToPath } from "url";
const app = express();

// path resolving
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



configDotenv({ path: path.join(__dirname, ".env") });
app.get("/", (req, res) => {
    res.send("Hello World!");
});
app.listen(process.env.PORT, () => {
    console.log("Server is running on port", process.env.PORT);
});
