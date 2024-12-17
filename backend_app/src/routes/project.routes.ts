import * as express from "express";
import { ProjectController } from "../controllers/project.controller";
import { authentification } from "../middlewares/auth.middleware";
const Router = express.Router();

Router.get(
    "/pendingProjects",  
    //authentification,
    ProjectController.getPendingProjects
);

export {Router as projectRouter};