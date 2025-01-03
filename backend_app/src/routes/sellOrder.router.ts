import * as express from "express";
import { SellOrderController } from "../controllers/sellOrder.controller";
const Router = express.Router();

Router.get(
  "/orders",  
  //authentification,
  SellOrderController.getAllSellOrders
);

Router.get(
  "/orders/active",  
  //authentification,
  SellOrderController.getActiveSellOrders
);

Router.get(
    "/userOrders/:address",  
    //authentification,
    SellOrderController.GetUserSellOrders
);

Router.post(
  "/addSellOrder/",  
  //authentification,
  SellOrderController.addSellOrder
);

Router.delete(
  "/orders/:orderId",  
  //authentification,
  SellOrderController.removeSellOrder
);

export {Router as sellOrderRouter};