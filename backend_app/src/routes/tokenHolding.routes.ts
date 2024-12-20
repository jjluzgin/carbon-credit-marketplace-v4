import * as express from "express";
import { TokenHoldingController } from "../controllers/tokenHolding.controller";
const Router = express.Router();

Router.get(
  "/allTokenHoldings",  
  //authentification,
  TokenHoldingController.GetAllTokenHoldings
);

Router.get(
  "/userTokens/:address",  
  //authentification,
  TokenHoldingController.GetUserTokens
);

Router.post(
    "/addTokenHolding",  
    //authentification,
    TokenHoldingController.AddTokenHolding
);

Router.delete(
  "/removeTokenHolding",  
  //authentification,
  TokenHoldingController.RemoveTokenHolding
);

export {Router as tokenHoldingRouter};