import { AppDataSource } from "./data-source";
import * as express from "express";
import * as dotenv from "dotenv";
import { Request, Response } from "express";
import { projectRouter } from "./routes/project.routes";
import "reflect-metadata";
import { errorHandler } from "./middlewares/error.middleware";

dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json()); // Parse JSON request bodies

app.get("/", (req, res) => {
    res.send("Welcome to the TypeORM SQLite Project!");
});

app.use("/api", projectRouter)

app.get("*", (req: Request, res: Response) => {
    res.status(404).json({ message: "Bad Request" });
});

app.use(errorHandler);

// Initialize the database connection
AppDataSource.initialize()
  .then(async () => {
    app.listen(PORT, () => {
      console.log("Server is running on http://localhost:" + PORT);
    });
    console.log("Data Source has been initialized!");
  })
  .catch((error) => console.log(error));
