import React, { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useActiveAccount } from "thirdweb/react";
import { prepareContractCall, readContract, sendTransaction } from "thirdweb";
import { marketplaceContract, carbonTokenContract } from "@/constants/constants";
import axios from "axios";

interface ProjectInfo {
  id: number;
  verificationId: string;
}

const CreateSellOrder = () => {
  const account = useActiveAccount();
  const [userProjects, setUserProjects] = useState<ProjectInfo[]>([]);
  const [projectId, setProjectId] = useState<number | undefined>();
  const [amount, setAmount] = useState<string>("");
  const [pricePerCreditInEth, setPricePerCreditInEth] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isCheckingApproval, setIsCheckingApproval] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const fetchUserTokens = async () => {
    try {
      const { data } = await axios.get(`http://localhost:5000/api/userTokens/${account?.address}`);
      const projectIds = data.tokenIds;
      const projectDetails = projectIds.map(async (projectId: number) => {
        const { data } = await axios.get(`http://localhost:5000/api/project/${projectId}/verificationId`);
        return {
          id: projectId,
          verificationId: data.id,
        };
      });
      setUserProjects(await Promise.all(projectDetails));
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
    if (projectId === undefined || !amount || !pricePerCreditInEth) {
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
      const pricePerCreditInWei = BigInt(Math.floor(parseFloat(pricePerCreditInEth) * 1e18));
      const transaction = await prepareContractCall({
        contract: marketplaceContract,
        method: "function createSellOrder(uint256 _projectId, uint256 _amount, uint256 _pricePerCredit)",
        params: [BigInt(projectId), BigInt(amount), pricePerCreditInWei],
      });
      const { transactionHash } = await sendTransaction({
        transaction: transaction,
        account: account,
      });
      console.log("Transaction successful:", transactionHash);
      setProjectId(undefined);
      setAmount("");
      setPricePerCreditInEth("");
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
              {userProjects.map((project) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.verificationId}
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
          <label className="text-sm font-medium">Price per Credit (ETH)</label>
          <Input
            type="number"
            placeholder="Enter price in ETH"
            value={pricePerCreditInEth}
            onChange={(e) => setPricePerCreditInEth(e.target.value)}
            min="0"
            step="0.000001"
          />
          {pricePerCreditInEth && (
            <p className="text-sm text-gray-500 mt-1">
              ≈ {(parseFloat(pricePerCreditInEth) * 1e18).toLocaleString()} Wei
            </p>
          )}
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

export default CreateSellOrder;
