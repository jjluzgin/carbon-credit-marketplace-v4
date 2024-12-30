import React, { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useActiveAccount } from "thirdweb/react";
import { Address, prepareContractCall, readContract, sendTransaction } from "thirdweb";
import { marketplaceContract, carbonTokenContract } from "@/constants/constants";
import axios from "axios";
import { Account } from "thirdweb/wallets";

const SubmitSellOrder = () => {
  const account = useActiveAccount();
  const [userProjects, setUserProjects] = useState<number[]>([]);
  const [projectId, setProjectId] = useState<number | undefined>();
  const [amount, setAmount] = useState<string>("");
  const [pricePerCredit, setPricePerCredit] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isCheckingApproval, setIsCheckingApproval] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const fetchUserTokens = async () => {
    try {
      const { data } = await axios.get(`http://localhost:5000/api/userTokens/${account?.address}`);
      const tokenIds = data.tokenIds;
      setUserProjects(tokenIds);
    } catch (error) {
      console.error("Error fetching user tokens:", error);
    }
  };

  const checkApproval = async () => {
    if (!account) return;

    setIsCheckingApproval(true);
    try {
      const result = await readContract({
        contract: carbonTokenContract,
        method: "function isApprovedForAll(address owner, address operator) view returns (bool)",
        params: [account.address, marketplaceContract.address],
      });
      setIsApproved(result);
    } catch (error) {
      console.error("Error checking approval:", error);
    } finally {
      setIsCheckingApproval(false);
    }
  };

  const handleApprove = async () => {
    if (!account) {
      alert("Please connect your wallet first.");
      return;
    }

    setIsApproving(true);
    try {
      const transaction = await prepareContractCall({
        contract: carbonTokenContract,
        method: "function setApprovalForAll(address operator, bool approved)",
        params: [marketplaceContract.address, true],
      });

      const { transactionHash } = await sendTransaction({
        transaction: transaction,
        account: account,
      });

      console.log("Approval transaction successful:", transactionHash);
      await checkApproval();
    } catch (error) {
      console.error("Error approving contract:", error);
      alert("Failed to approve contract.");
    } finally {
      setIsApproving(false);
    }
  };

  const handleSubmit = async () => {
    if (projectId === undefined || !amount || !pricePerCredit) {
      alert("All fields are required!");
      return;
    }
    if (!account) {
      alert("Please connect your wallet first.");
      return;
    }
    if (!isApproved) {
      alert("Please approve the contract first.");
      return;
    }

    setIsSubmitting(true);
    try {
      const transaction = await prepareContractCall({
        contract: marketplaceContract,
        method: "function createSellOrder(uint256 _projectId, uint256 _amount, uint256 _pricePerCredit)",
        params: [BigInt(projectId), BigInt(amount), BigInt(pricePerCredit)],
      });
      const { transactionHash } = await sendTransaction({
        transaction: transaction,
        account: account,
      });
      console.log("Transaction successful:", transactionHash);
      setProjectId(undefined);
      setAmount("");
      setPricePerCredit("");
    } catch (error) {
      console.error("Error posting order:", error);
      alert("Failed to post order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (account) {
      fetchUserTokens();
      checkApproval();
    }
  }, [account]);

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Create Sell Order</CardTitle>
        <CardDescription>
          Select a project and specify the amount and price per credit to create a new sell order.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Project</label>
          <Select onValueChange={(value) => setProjectId(Number(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {userProjects.map((id) => (
                <SelectItem key={id} value={id.toString()}>
                  Project ID: {id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Amount</label>
          <Input
            type="number"
            placeholder="Enter amount of credits"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Price per Credit</label>
          <Input
            type="number"
            placeholder="Enter price per credit"
            value={pricePerCredit}
            onChange={(e) => setPricePerCredit(e.target.value)}
            min="0"
            step="0.01"
          />
        </div>

        {!isApproved && (
          <Button onClick={handleApprove} className="w-full" disabled={isApproving || isCheckingApproval}>
            {isApproving ? "Approving..." : "Approve Contract"}
          </Button>
        )}

        <Button onClick={handleSubmit} className="w-full" disabled={isSubmitting || !isApproved}>
          {isSubmitting ? "Submitting..." : "Create Sell Order"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SubmitSellOrder;
