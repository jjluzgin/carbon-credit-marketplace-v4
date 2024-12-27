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
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import { Account } from "thirdweb/wallets";
import { Address, prepareContractCall, readContract, sendTransaction } from "thirdweb";
import { carbonTokenContract, projectRegistryContract } from "@/constants/constants";
import axios from "axios";
import { Calendar, Scale, Leaf, User, Info, Check, BarChart3 } from "lucide-react";
import AddressDisplay from "./AddressDisplay";

interface RetireButtonProps {
  tokenId: number;
  account: Account | undefined;
}

interface ProjectData {
  verificationId: string;
  status: number;
  owner: string;
  auditor: string;
  ipfsCID: string;
  carbonRemoved: BigInt;
  creditsIssued: BigInt;
  creditTotalSupply: BigInt;
  creditRetiredAmount: BigInt;  
  authenticationDate: BigInt;
}

const ProjectDetailsButton: React.FC<RetireButtonProps> = ({ tokenId, account }) => {
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectData, setProjectData] = useState<ProjectData>();

  const handleGetDetails = async () => {
    if (!account) {
      alert("Please connect your wallet first.");
      return;
    }
    setIsSubmitting(true);
    try {
      const [status, , owner, auditor, authenticationDate, carbonRemoved, creditsIssued, ipfsCID] =
        await readContract({
          contract: projectRegistryContract,
          method:
            "function projects(uint256) view returns (uint8 status, bytes32 uniqueVerificationId, address projectOwner, address auditor, uint256 authenticationDate, uint256 carbonRemoved, uint256 creditsIssued, string ipfsCID)",
          params: [BigInt(tokenId)],
      });
      //
      console.log(tokenId);
      const response = await axios.get(`http://localhost:5000/api/project/${tokenId}`);
      console.log(response);
      const projectInfo = response.data.project;
      console.log(projectInfo.verificationId);
      const tokenSupply = await readContract({
        contract: carbonTokenContract,
        method: "function totalSupply(uint256 id) view returns (uint256)",
        params: [BigInt(tokenId)],
      });

      const retiredAmount = await readContract({
        contract: carbonTokenContract,
        method: "function getProjectTotalRetirements(uint256 _projectId) view returns (uint256)",
        params: [BigInt(tokenId)],
      });
      const currentProjectData : ProjectData = {
        verificationId: projectInfo.verificationId,
        status: status,
        owner: owner,
        auditor: auditor,
        ipfsCID: ipfsCID,
        carbonRemoved: carbonRemoved,
        creditsIssued: creditsIssued,
        creditTotalSupply: tokenSupply,
        creditRetiredAmount: retiredAmount,
        authenticationDate: authenticationDate
      }
      setProjectData(currentProjectData);
    } catch (error) {
      console.error("Error fetch project:", error);
      alert("Failed to fetch project.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (timestamp: BigInt) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  const formatBigInt = (value: BigInt) => {
    return Number(value).toLocaleString();
  };

  const getStatusBadge = (status: number) => {
    const statusMap = {
      0: { label: "Pending", className: "bg-yellow-500" },
      1: { label: "Audited", className: "bg-green-500" },
      2: { label: "Rejected", className: "bg-red-500" }
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: "Unknown", className: "bg-gray-500" };
    return <Badge className={`${statusInfo.className} text-white`}>{statusInfo.label}</Badge>;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" onClick={handleGetDetails}>Details</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            Project Details 
            {projectData && getStatusBadge(projectData.status)}
          </DialogTitle>
          <DialogDescription>
            Verification ID: {projectData?.verificationId}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-6 py-4">
          <Card className="col-span-2">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-500">Carbon Removed</p>
                    <p className="font-medium">{projectData && formatBigInt(projectData.carbonRemoved)} tons</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-500">Credits Issued</p>
                    <p className="font-medium">{projectData && formatBigInt(projectData.creditsIssued)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="font-medium">Project Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Owner</p>
                  <AddressDisplay address={projectData?.owner || ''} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Auditor</p>
                  <AddressDisplay address={projectData?.auditor || ''} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Authentication Date</p>
                  <p className="font-medium">{projectData && formatDate(projectData.authenticationDate)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Credit Statistics</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Total Supply</p>
                  <p className="font-medium">{projectData && formatBigInt(projectData.creditTotalSupply)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Retired Amount</p>
                  <p className="font-medium">{projectData && formatBigInt(projectData.creditRetiredAmount)}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator className="col-span-2 my-4" />

          <div className="col-span-2 space-y-4">
            <h3 className="font-medium">Retire Credits</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount to Retire</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="reason">Retirement Reason</Label>
                <Input
                  id="reason"
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDetailsButton;
