import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";

import {
  Address,
  prepareContractCall,
  readContract,
  sendTransaction,
} from "thirdweb";
import {
  auditorRole,
  carbonTokenContract,
  projectOwnerRole,
  projectRegistryContract,
} from "@/constants/constants";
import { useActiveAccount } from "thirdweb/react";

const ProjectSubmissionCard = () => {
  const account = useActiveAccount();

  const [carbonReduction, setCarbonReduction] = useState<number | undefined>();
  const [ipfs, setIpfs] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectId, setProjectId] = useState<number | undefined>();

  const [isAuditor, setIsAuditor] = useState(false);
  const [IsProjectOwner, setIsProjectOwner] = useState(false);

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
        method:
          "function addProject(uint256 _carbonReduction, string _ipfsCID, string _verificationId)",
        params: [BigInt(carbonReduction), ipfs, verificationId],
      });
      const { transactionHash } = await sendTransaction({
        transaction: transaction,
        account: account,
      });
      console.log("Transaction successful:", transactionHash);
      alert("Project submitted successfully!");
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

  const handleProjectAccept = async () => {
    if (!projectId) {
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
        contract: carbonTokenContract,
        method: "function acceptProject(uint256 _projectId)",
        params: [BigInt(projectId - 1)],
      });
      const { transactionHash } = await sendTransaction({
        transaction,
        account,
      });
      console.log("Transaction successful:", transactionHash);
      alert("Project accepted successfully!");
      setProjectId(undefined);
    } catch (error) {
      console.error("Error accepting project:", error);
      alert("Failed to accept project.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkRole = useCallback(
    async (roleHash: Address, setState: (value: boolean) => void) => {
      if (!account) return;
      try {
        const data = await readContract({
          contract: projectRegistryContract,
          method:
            "function hasRole(bytes32 role, address account) view returns (bool)",
          params: [roleHash, account.address],
        });
        setState(data);
      } catch (error) {
        console.error("Error checking role:", error);
        alert("Failed to check role.");
      }
    },
    [account],
  );

  useEffect(() => {
    if (!account) {
      alert("Please connect your wallet first.");
      return;
    }
    const checkRoles = async () => {
      await Promise.all([
        checkRole(auditorRole, setIsAuditor),
        checkRole(projectOwnerRole, setIsProjectOwner),
      ]);
    };

    checkRoles();
  }, [account, checkRole]);

  return (
    <>
      {IsProjectOwner && (
        <Card className="w-full max-w-lg mx-auto p-4">
          <CardHeader>
            <CardTitle>Submit Your Project</CardTitle>
            <CardDescription>
              Provide project details to submit them to the blockchain.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                placeholder="Carbon Reduced"
                value={carbonReduction}
                type="number"
                onChange={(e) =>
                  setCarbonReduction(
                    e.target.value ? parseInt(e.target.value, 10) : undefined,
                  )
                }
              />
              <Input
                placeholder="IPFS link"
                value={ipfs}
                onChange={(e) => setIpfs(e.target.value)}
              />
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
              className="bg-blue-500 text-white hover:bg-blue-600"
            >
              {isSubmitting ? "Submitting..." : "Submit Project"}
            </Button>
          </CardFooter>
        </Card>
      )}
      {isAuditor && (
        <Card>
          <CardHeader>
            <CardTitle>Accept Project</CardTitle>
            <CardDescription>
              Accept project to allow minting credits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                placeholder="Project ID"
                value={projectId}
                type="number"
                onChange={(e) =>
                  setProjectId(
                    e.target.value ? parseInt(e.target.value, 10) : undefined,
                  )
                }
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              onClick={handleProjectAccept}
              disabled={isSubmitting}
              className="bg-blue-500 text-white hover:bg-blue-600"
            >
              {isSubmitting ? "Accepting..." : "Accept Project"}
            </Button>
          </CardFooter>
        </Card>
      )}
    </>
  );
};

export default ProjectSubmissionCard;
