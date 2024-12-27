// In your parent component:
import { prepareContractCall, sendTransaction } from 'thirdweb';
import SellOrdersDisplay from './SellOrdersDisplay';
import { marketplaceContract } from '@/constants/constants';
import { useActiveAccount } from 'thirdweb/react';
import { useEffect, useState } from 'react';
import { SellOrderDto } from '../../../shared/types/OrderDto';
import axios from 'axios';

const SellOrdersComponent = () => {
  const account = useActiveAccount();
  const [orders, setOrders] = useState<SellOrderDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleBuy = async (orderId: number, totalPriceWei: number) => {
    if (!account) {
      alert("Please connect your wallet first.");
      return;
    }
    try {
      setIsLoading(true);
      console.log(orderId);
      console.log(totalPriceWei);
      const transaction = await prepareContractCall({
        contract: marketplaceContract,
        method: "function executeTrade(uint256 _orderId) payable",
        params: [BigInt(orderId)],
        value: BigInt(totalPriceWei),
      });
      const { transactionHash } = await sendTransaction({
        transaction,
        account: account,
      });
      // Refresh orders after successful purchase
      await fetchActiveOrders();
    } catch (error) {
      console.error("Error buying credits:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActiveOrders = async () => {
    setIsLoading(true);
    try {
      const {data} = await axios.get("http://localhost:5000/api/orders/active");
      setOrders(data.orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveOrders();
  }, [account])

  return (
    <SellOrdersDisplay
      activeOrders={orders}
      onBuyClick={handleBuy}
      isLoading={isLoading}
      onRefresh={fetchActiveOrders}
    />
  );
}

export default SellOrdersComponent;