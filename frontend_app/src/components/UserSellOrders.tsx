import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prepareContractCall, sendTransaction } from "thirdweb";
import { Table, TableHeader, TableRow, TableCell, TableBody, TableHead } from "./ui/table";
import { marketplaceContract } from "@/constants/constants";
import { Account } from "thirdweb/wallets";
import axios from "axios";
import { useActiveAccount } from "thirdweb/react";
import { SellOrderDto } from "../../../shared/types/OrderDto";

interface SellOrderDtoWithVerification extends SellOrderDto {
  verificationId: number;
}

const UserSellOrders = () => {
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);
  const [userOrders, setUserOrders] = useState<SellOrderDtoWithVerification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const account = useActiveAccount();

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatPrice = (priceWei: number) => {
    // Convert wei to ETH (1 ETH = 10^18 wei)
    const priceEth = priceWei / 1e18;
    return `${priceEth} ETH`;
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!account) {
      alert("Please connect your wallet first.");
      return;
    }
    setCancellingOrderId(orderId);
    try {
      const transaction = await prepareContractCall({
        contract: marketplaceContract,
        method: "function removeSellOrder(uint256 _orderId)",
        params: [BigInt(orderId)],
      });
      const { transactionHash } = await sendTransaction({
        transaction,
        account,
      });

      console.log("Order cancelled successfully:", transactionHash);
      // You might want to add a callback here to refresh the orders list
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert("Failed to cancel order.");
    } finally {
      setCancellingOrderId(null);
    }
  };

  const fetchUserOrders = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`http://localhost:5000/api/orders/${account?.address}`);
      const orders = data.orders;
      const ordersWithVerificationId = orders.map(async (order : SellOrderDto) => {
        try{
          const { data } = await axios.get(`http://localhost:5000/api/project/${order.projectId}/verificationId`);
          return {...order, verificationId: data.id};
        } catch (error) {
          console.error("Error fetching verification ids:", error);
          throw error;
        }
      });
      setUserOrders(await Promise.all(ordersWithVerificationId));
    } catch (error) {
      console.error("Error fetching token balances:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (account?.address) {
      fetchUserOrders();
    } else {
      setLoading(false);
    }
  }, [account]);

  if (userOrders.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="py-4">
          <p className="text-center text-gray-500">No active sell orders found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle>Your Active Sell Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Project ID</TableHead>
              <TableHead className="w-[100px]">Amount</TableHead>
              <TableHead className="w-[120px]">Price</TableHead>
              <TableHead className="w-[120px]">Expires</TableHead>
              <TableHead className="w-[100px] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userOrders.map((order) => (
              <TableRow key={order.orderId}>
                <TableCell className="font-medium">#{order.verificationId}</TableCell>
                <TableCell>{order.creditsAmount}</TableCell>
                <TableCell>{formatPrice(order.totalPriceWei)}</TableCell>
                <TableCell>{formatDate(order.expirationDate)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    onClick={() => handleCancelOrder(order.orderId)}
                    disabled={cancellingOrderId === order.orderId}
                    variant="destructive"
                    size="sm">
                    {cancellingOrderId === order.orderId ? "..." : "Cancel"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default UserSellOrders;
