import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

import { prepareContractCall, sendTransaction } from "thirdweb";
import { projectRegistryContract } from "@/constants/constants";
import { useActiveAccount } from "thirdweb/react";
import { FileUpload } from "./FileUpload";
import { Alert, AlertDescription } from "./ui/alert";
import { AlertCircle } from "lucide-react";
import { upload } from "thirdweb/storage";
import { client } from "@/app/client";

const SubmitProjectCard = () => {
  const account = useActiveAccount();
  const [ipfsCID, setIpfsCID] = useState("");
  const [carbonReduction, setCarbonReduction] = useState<number | undefined>();
  const [verificationId, setVerificationId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);

  const handleFileUpload = async () => {
    if (files.length === 0) {
      throw new Error("Please select a file first");
    }
    try {
      const uris = await upload({
        client: client,
        files: files,
        uploadWithoutDirectory: false,
      });
      console.log("URIS:", uris);
      const cid = uris[0].replace("ipfs://", "").split("/")[0];
      console.log("CID:", cid);

      console.log(`https://ipfs.io/ipfs/${cid}/`);
      setIpfsCID(cid);
    } catch (error) {
      setIpfsCID("");
      setError(`Error uploading document: ${error}`);
      throw error;
    }
  };

  const handleProjectSubmit = async () => {
    if (!carbonReduction || !verificationId) {
      setError("All fields are required!");
      return;
    }
    if (!account) {
      setError("Please connect your wallet first.");
      return;
    }
    if (files.length === 0) {
      setError("Please select a file to upload!");
      return;
    }

    setIsSubmitting(true);
    setError("");
    await handleFileUpload();
    try {
      const transaction = await prepareContractCall({
        contract: projectRegistryContract,
        method: "function addProject(uint256 _carbonReduction, string _ipfsCID, string _verificationId)",
        params: [BigInt(carbonReduction), ipfsCID, verificationId],
      });
      const { transactionHash } = await sendTransaction({
        transaction: transaction,
        account: account,
      });
      console.log("Transaction successful:", transactionHash);
      setCarbonReduction(undefined);
      setFiles([]);
      setVerificationId("");
    } catch (error) {
      console.error("Error submitting project:", error);
      setError(error instanceof Error ? error.message : "Failed to submit project.");
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
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-4">
          {/* <Input
            placeholder="Email Address"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            type="email"
            required
          /> */}
          <Input
            placeholder="Carbon Reduced"
            value={carbonReduction}
            type="number"
            onChange={(e) => setCarbonReduction(e.target.value ? parseInt(e.target.value, 10) : undefined)}
          />
          <FileUpload onFileChange={setFiles} disabled={isSubmitting} label="Verified Documents" />
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

export default SubmitProjectCard;
