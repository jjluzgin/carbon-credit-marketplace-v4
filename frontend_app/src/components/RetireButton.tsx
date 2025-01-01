import React, { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog"; // Adjust the import path as necessary
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Account } from "thirdweb/wallets";
import { prepareContractCall, sendTransaction } from "thirdweb";
import { carbonTokenContract } from "@/constants/constants";

interface RetireButtonProps {
  tokenId: number;
  account: Account | undefined;
  initialTokenBalance: number;
}

const RetireButton: React.FC<RetireButtonProps> = ({ tokenId, account, initialTokenBalance }) => {
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRetire = async () => {
    if (!account) {
      alert("Please connect your wallet first.");
      return;
    }
    if (amount === 0 || !reason) {
      alert("All fields are required!");
      return;
    }

    try {
      const transaction = prepareContractCall({
        contract: carbonTokenContract,
        method: "function retireCredits(uint256 _projectId, uint256 _amount, string _description)",
        params: [BigInt(tokenId), BigInt(amount), reason],
      });
      const { transactionHash } = await sendTransaction({
        transaction,
        account: account,
      });

      console.log("Retirement successful:", transactionHash);
    } catch (error) {
      console.error("Error retirint credits:", error);
      alert("Failed to retire credits.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    handleRetire();
    // Reset form fields after submission
    setAmount(0);
    setReason("");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-red-800">Retire</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Retire Tokens</DialogTitle>
          <DialogDescription>Enter the amount and reason for retiring your tokens.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2 pb-4">
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="reason">Reason</Label>
            <Input
              id="reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-2"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RetireButton;
