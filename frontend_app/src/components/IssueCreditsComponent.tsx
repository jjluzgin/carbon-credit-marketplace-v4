import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { getAddress, isAddress, prepareContractCall, readContract, sendTransaction } from "thirdweb";
import { carbonTokenContract, projectRegistryContract } from "@/constants/constants";

const IssueCreditsComponent = () => {
  const account = useActiveAccount();
  const [projectId, setProjectId] = useState<number | undefined>();
  const [creditAmount, setCreditAmount] = useState<number | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleIssueCredits = async () => {
    if (projectId === undefined || !creditAmount) {
      alert("All fields are required!");
      return;
    }
    if (!account) {
      alert("Please connect your wallet first.");
      return;
    }
    setIsSubmitting(true);

    try {
      const owner = await readContract({
        contract: projectRegistryContract,
        method:
          "function getProjectOwner(uint256 _projectId) view returns (address)",
        params: [BigInt(projectId)],
      });
      const ownerAddress = getAddress(owner);
      console.log("Owner found:", ownerAddress);
      const transaction = await prepareContractCall({
        contract: carbonTokenContract,
        method:
          "function mintCredits(address _to, uint64 _projectId, uint256 _amount, bytes _data)",
        params: [ownerAddress, BigInt(projectId), BigInt(creditAmount), "0x" ],
      });
      const { transactionHash } = await sendTransaction({
        transaction: transaction,
        account: account,
      });
      console.log("Transaction successful:", transactionHash);
      setProjectId(undefined);
      setCreditAmount(undefined);
    } catch (error) {
      console.error("Error submitting project:", error);
      alert("Failed to mint tokens.");
    } finally {
      setProjectId(undefined);
      setCreditAmount(undefined);
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto p-4">
      <CardHeader>
        <CardTitle>Submit Your Project</CardTitle>
        <CardDescription>Provide project details to submit them to the blockchain.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            placeholder="Project ID"
            value={projectId}
            type="number"
            onChange={(e) => setProjectId(e.target.value ? parseInt(e.target.value, 10) : undefined)}
          />
          <Input
            placeholder="Amount"
            value={creditAmount}
            type="number"
            onChange={(e) => setCreditAmount(e.target.value ? parseInt(e.target.value, 10) : undefined)}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={handleIssueCredits}
          disabled={isSubmitting}
          className="bg-blue-500 text-white hover:bg-blue-600">
          {isSubmitting ? "Issuing..." : "Issue Credits"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default IssueCreditsComponent;
