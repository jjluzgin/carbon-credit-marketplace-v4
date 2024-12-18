import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

import { prepareContractCall, sendTransaction, watchContractEvents } from "thirdweb";
import { projectRegistryContract } from "@/constants/constants";
import { useActiveAccount } from "thirdweb/react";

const ProjectSubmissionCard = () => {
  const account = useActiveAccount();
  const [carbonReduction, setCarbonReduction] = useState<number | undefined>();
  const [ipfs, setIpfs] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProjectSubmit = async () => {
    if (!carbonReduction || !ipfs || !verificationId) {
      alert("All fields are required!");
      return;
    }
    if (!account) {
      alert("Please connect your wallet first.");
      return;
    }
    setIsSubmitting(true);
    try {
      const transaction = await prepareContractCall({
        contract: projectRegistryContract,
        method: "function addProject(uint256 _carbonReduction, string _ipfsCID, string _verificationId)",
        params: [BigInt(carbonReduction), ipfs, verificationId],
      });
      const { transactionHash } = await sendTransaction({
        transaction: transaction,
        account: account,
      });
      console.log("Transaction successful:", transactionHash);
      setCarbonReduction(undefined);
      setIpfs("");
      setVerificationId("");
    } catch (error) {
      console.error("Error submitting project:", error);
      alert("Failed to submit project.");
    } finally {
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
            placeholder="Carbon Reduced"
            value={carbonReduction}
            type="number"
            onChange={(e) => setCarbonReduction(e.target.value ? parseInt(e.target.value, 10) : undefined)}
          />
          <Input placeholder="IPFS link" value={ipfs} onChange={(e) => setIpfs(e.target.value)} />
          <Input
            placeholder="Verification ID"
            value={verificationId}
            onChange={(e) => setVerificationId(e.target.value)}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={handleProjectSubmit}
          disabled={isSubmitting}
          className="bg-blue-500 text-white hover:bg-blue-600">
          {isSubmitting ? "Submitting..." : "Submit Project"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProjectSubmissionCard;
