import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Clock, CreditCard } from "lucide-react";
import { SellOrderDto } from "../../../shared/types/OrderDto";
import ProjectDetailsButton from "./ProjectDetailsButton";
import { useActiveAccount } from "thirdweb/react";

interface SellOrdersDisplayProps {
  activeOrders: SellOrderDto[];
  onBuyClick: (orderId: number, totalPriceWei: number) => Promise<void>;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const SellOrdersDisplay = ({ activeOrders, onBuyClick, isLoading = false, onRefresh }: SellOrdersDisplayProps) => {
  const account = useActiveAccount();

  // Format Wei to ETH
  const formatEth = (wei: number) => {
    return (wei / 1e18).toFixed(6);
  };

  const getTimeRemaining = (expirationDate: number) => {
    const now = Date.now();
    const expiration = expirationDate * 1000;
    const diff = expiration - now;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return `${days}d ${hours}h remaining`;
  };
  const truncateAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Active Sell Orders</h2>
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        )}
      </div>

      {activeOrders.length === 0 ? (
        <Card className="bg-muted">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No active sell orders available</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeOrders.map((order) => (
            <Card key={order.orderId} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Order #{order.orderId}</span>                  
                  <ProjectDetailsButton tokenId={order.projectId} account={account} size="default" variant="outline" />
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Credits:</span>
                    <span className="font-medium">{order.creditsAmount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Price:</span>
                    <span className="font-medium">{formatEth(order.totalPriceWei)} ETH</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Price per Credit:</span>
                    <span className="font-medium">{formatEth(order.totalPriceWei / order.creditsAmount)} ETH</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Seller:</span>
                    <span className="font-medium truncate ml-2 max-w-[200px]">{truncateAddress(order.seller)}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground mt-4">
                    <Clock className="h-4 w-4 mr-1" />
                    {getTimeRemaining(order.expirationDate)}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => onBuyClick(order.orderId, order.totalPriceWei)}
                  disabled={isLoading}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Buy Credits
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellOrdersDisplay;
