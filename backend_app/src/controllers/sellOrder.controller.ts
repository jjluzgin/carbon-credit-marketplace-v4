import { NextFunction, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import * as cache from "memory-cache";
import { SellOrder } from "../entity/SellOrder.entity";
import { SellOrderDto } from "../../../shared/types/OrderDto";
import { MoreThan } from "typeorm";

export class SellOrderController {
  static async getAllSellOrders(req: Request, res: Response) {
    const data = cache.get("allOrders");
    if (data) {
      console.log("serving from cache");
      res.status(200).json({ orders: data });
      return;
    } else {
      console.log("serving from db");
      const orderRepository = AppDataSource.getRepository(SellOrder);
      const orders = await orderRepository.find();
      const dto: SellOrderDto[] = orders.map((order) => ({
        orderId: order.orderId,
        seller: order.seller,
        projectId: order.projectId,
        creditsAmount: order.creditsAmount,
        totalPriceWei: order.totalPrice,
        expirationDate: order.expirationDate,
      }));
      cache.put("allOrders", dto, 10000);
      res.status(200).json({ orders: dto });
      return;
    }
  }

  static async GetUserSellOrders(req: Request, res: Response) {
    const { address } = req.params;
    try {
      const orderRepository = AppDataSource.getRepository(SellOrder);
      const sellOrders = await orderRepository.find({
        where: { seller: address },
      });
      const dto: SellOrderDto[] = sellOrders.map((order) => ({
        orderId: order.orderId,
        seller: order.seller,
        projectId: order.projectId,
        creditsAmount: order.creditsAmount,
        totalPriceWei: order.totalPrice,
        expirationDate: order.expirationDate,
      }));
      console.log("serving from db");
      res.status(200).json({ orders: dto });
      return;
    } catch (error) {
      console.error("Error fetching user sell order:", error);
      res.status(500).json({
        message: "An error occurred while fetching user sell orders.",
      });
      return;
    }
  }

  static async getActiveSellOrders(req: Request, res: Response) {
    const data = cache.get("activeOrders");
    if (data) {
      console.log("serving from cache");
      res.status(200).json({ orders: data });
      return;
    } else {
      console.log("serving from db");
      const orderRepository = AppDataSource.getRepository(SellOrder);
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const orders = await orderRepository.find({where: {expirationDate: MoreThan(currentTimestamp)}});
      const dto: SellOrderDto[] = orders.map((order) => ({
        orderId: order.orderId,
        seller: order.seller,
        projectId: order.projectId,
        creditsAmount: order.creditsAmount,
        totalPriceWei: order.totalPrice,
        expirationDate: order.expirationDate,
      }));
      cache.put("activeOrders", dto, 10000);
      res.status(200).json({ orders: dto });
      return;
    }
  }

  static async addSellOrder(req: Request, res: Response) {
    const {
      orderId,
      seller,
      projectId,
      creditsAmount,
      totalPrice,
      expirationDate,
    } = req.body;
    try {
      const parsedOrderId = parseInt(orderId);
      const orderRepository = AppDataSource.getRepository(SellOrder);
      const existingOrder = await orderRepository.findOne({
        where: { orderId: parsedOrderId },
      });
      if (existingOrder) {
        res
          .status(200)
          .json({ message: "Order already exists", existingOrder });
        return;
      } else {
        const order = new SellOrder();
        order.orderId = parsedOrderId;
        order.seller = seller;
        order.projectId = parseInt(projectId);
        order.creditsAmount = parseInt(creditsAmount);
        order.totalPrice = parseInt(totalPrice);
        order.expirationDate = parseInt(expirationDate);
        await orderRepository.save(order);
        res.status(200).json({ message: "New order added succesfully", order });
        return;
      }
    } catch (error) {
      console.error("Error adding new order:", error.message);
      res.status(500).json({
        message: "An error occurred while adding new order.",
      });
      return;
    }
  }

  static async removeSellOrder(req: Request, res: Response) {
    const { orderId } = req.params;
    const parsedOrderId = parseInt(orderId);
    if (isNaN(parsedOrderId)) {
      res.status(400).json({ message: "Invalid order ID" });
      return;
    }
    const orderRepository = AppDataSource.getRepository(SellOrder);
    const order = await orderRepository.findOne({
      where: { orderId: parsedOrderId },
    });
    if (!order) {
      res.status(400).json({ message: "Couldn't find order" });
      return;
    }
    await orderRepository.remove(order);
    res.status(200).json({ message: "Order removed successfully" });
    return;
  }
}
