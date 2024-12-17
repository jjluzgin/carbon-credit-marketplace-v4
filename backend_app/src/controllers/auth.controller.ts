import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

// Dummy message to sign (can be dynamic)
const AUTH_MESSAGE = "Sign this message to authenticate with our app";

export class AuthController {
    static async signIn(req: Request, res: Response ) {
        try {
            const { address, signature } = req.body;

            // Input validation
            if (!address || !signature) {
                res.status(400).json({ error: "Address and signature are required" });
                return;
            }

            // Verify the signature
            const recoveredAddress = ethers.verifyMessage(AUTH_MESSAGE, signature);

            if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
                res.status(401).json({ error: "Invalid signature" });
                return; 
            }

            // Create a JWT token
            const token = jwt.sign(
                { address }, // Payload
                JWT_SECRET,  // Secret key
                { expiresIn: JWT_EXPIRES_IN } // Expiry time
            );

            res.status(200).json({
                message: "Authentication successful",
                token,
            });
            return; 
        } catch (error) {
            console.error("Error during authentication:", error);
            res.status(500).json({ error: "Internal server error" });
            return; 
        }
    }
}
