import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";

const authRouter = Router();

// Sign-in route
authRouter.post("/signin", AuthController.signIn);

export { authRouter };
