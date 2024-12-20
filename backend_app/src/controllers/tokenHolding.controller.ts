import { Request, Response } from "express";
import { TokenHolding } from "../entity/TokenHolding.entity";
import { AppDataSource } from "../data-source";
import * as cache from "memory-cache";

export class TokenHoldingController {
  static async GetAllTokenHoldings(req: Request, res: Response) {
    const data = cache.get("tokeHoldings");
    if (data) {
      console.log("serving from cache");
      res.status(200).json({ data });
      return;
    } else {
      console.log("serving from db");
      const tokenHoldingRepo = AppDataSource.getRepository(TokenHolding);
      const holding = await tokenHoldingRepo.find();
      cache.put("tokeHoldings", holding, 10000);
      res.status(200).json({ data: holding });
      return;
    }
  }

  static async AddTokenHolding(req: Request, res: Response) {
    const { userAddress, projectId } = req.body;
    const parsedProjectId = projectId === "0" ? 0 : parseInt(projectId);
    if (isNaN(parsedProjectId)) {
      res.status(400).json({ message: "Invalid projectId" });
      return;
    }

    const tokenHoldingRepo = AppDataSource.getRepository(TokenHolding);
    const existingHolding = await tokenHoldingRepo.findOne({
      where: { userAddress: userAddress, tokenId: parsedProjectId },
    });
    if (existingHolding) {
      res
        .status(200)
        .json({ message: "Token holding already exists", existingHolding });
      return;
    }
    try {
      const holding = new TokenHolding();
      holding.userAddress = userAddress;
      holding.tokenId = parsedProjectId;
      await tokenHoldingRepo.save(holding);
      res
        .status(200)
        .json({ message: "Token holding added succesfully", holding });
      return;
    } catch (error) {
      console.error("Error saving token holding:", error.message);
      res.status(500).json({
        message: "An error occurred while saving token holding.",
      });
      return;
    }
  }

  static async RemoveTokenHolding(req: Request, res: Response) {
    const { userAddress, projectId } = req.body;
    const parsedProjectId = projectId === "0" ? 0 : parseInt(projectId);
    if (isNaN(parsedProjectId)) {
      res.status(400).json({ message: "Invalid projectId" });
      return;
    }
    const tokenHoldingRepo = AppDataSource.getRepository(TokenHolding);
    const holding = await tokenHoldingRepo.findOne({
      where: { userAddress: userAddress, tokenId: parsedProjectId },
    });
    if (!holding) {
      res.status(400).json({ message: "Couldn't find token holding" });
      return;
    }
    await tokenHoldingRepo.remove(holding);
  }

  static async GetUserTokens(req: Request, res: Response) {
    const { address } = req.params;
    const cacheKey = `userTokens_${address}`;
    try {
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        console.log("serving from cache");
        res.status(200).json({ tokenIds: cachedData });
        return;
      }
      const tokenHoldingRepo = AppDataSource.getRepository(TokenHolding);
      const holdings = await tokenHoldingRepo.find({
        where: { userAddress: address },
      });
      const tokenIds = holdings.map((holding) => holding.tokenId);
      cache.put(cacheKey, tokenIds, 10000);
      res.status(200).json({ tokenIds: tokenIds });
      return;
    } catch (error) {
      console.error("Error fetching user tokens:", error);
      res.status(500).json({
        message: "An error occurred while fetching user tokens.",
      });
      return;
    }
  }
}
