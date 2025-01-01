import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

import { prepareContractCall, sendTransaction } from "thirdweb";
import { projectRegistryContract } from "@/constants/constants";
import { useActiveAccount } from "thirdweb/react";
import { FileUpload } from "./FileUpload";
import { Alert, AlertDescription } from "./ui/alert";
import { AlertCircle, Plus } from "lucide-react";
import { upload } from "thirdweb/storage";
import { client } from "@/app/client";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";

const SubmitProjectCard = () => {
  const account = useActiveAccount();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
      let cid = "";
      if(files.length == 0)
        return "";
      else if(files.length > 1){
        const uris = await upload({
          client: client,
          files: files,
          uploadWithoutDirectory: false,
        });
        cid = uris[0].replace("ipfs://", "").split("/")[0];
      }else{
        const uri = await upload({
          client: client,
          files: [files[0]],
          uploadWithoutDirectory: false,
        });
        cid = uri.replace("ipfs://", "").split("/")[0];
      }
      console.log("CID:", cid);
      console.log(`https://ipfs.io/ipfs/${cid}/`);
      return cid;
    } catch (error) {
      setError(`Error uploading document: ${error}`);
      throw error;
    }
  };

  const resetForm = () => {
    setCarbonReduction(undefined);
    setVerificationId("");
    setFiles([]);
    setError("");
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
    const ipfsCID = await handleFileUpload();
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
      resetForm();
    } catch (error) {
      console.error("Error submitting project:", error);
      setError(error instanceof Error ? error.message : "Failed to submit project.");
      alert("Project submition failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={(open) => {
      setIsDialogOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Submit New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle>Submit New Project</CardTitle>
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
              <Input
                placeholder="Verification ID"
                value={verificationId}
                onChange={(e) => setVerificationId(e.target.value)}
              />
              <Input
                placeholder="Carbon Reduction in tons (CO2e)"
                value={carbonReduction}
                type="number"
                onChange={(e) => setCarbonReduction(e.target.value ? parseInt(e.target.value, 10) : undefined)}
              />
              <FileUpload onFileChange={setFiles} disabled={isSubmitting} label="Upload project files" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleProjectSubmit}
              disabled={isSubmitting}
              className="bg-blue-500 text-white hover:bg-blue-600"
            >
              {isSubmitting ? "Submitting..." : "Submit Project"}
            </Button>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default SubmitProjectCard;
