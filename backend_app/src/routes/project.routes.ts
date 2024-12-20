import * as express from "express";
import { ProjectController } from "../controllers/project.controller";
import { authentification } from "../middlewares/auth.middleware";
const Router = express.Router();

Router.get(
    "/pendingProjects",  
    //authentification,
    ProjectController.getPendingProjects
);

Router.get(
    "/userProjects/:owner",  
    //authentification,
    ProjectController.getUserProjects
);

Router.post(
    "/addProject",
    // authentification,
    ProjectController.addProject
);

Router.put(
    "/updateProject/:projectId",
    // authentification,
    ProjectController.updateProject
);

export {Router as projectRouter};