import { Table, TableHeader, TableRow, TableCell, TableBody } from "./ui/table";
import React, { useEffect, useState } from "react";
import { PendingProjectDto } from "../../../shared/types/ProjectDto";
import axios from "axios";
import { Skeleton } from "./ui/skeleton";
import { useActiveAccount } from "thirdweb/react";
import { projectRegistryContract } from "@/constants/constants";
import { prepareContractCall, sendTransaction } from "thirdweb";
import { Button } from "./ui/button";
import { FileText } from "lucide-react";

const PendingProjectsTable: React.FC = () => {
  const [pendingProjects, setPendingProjects] = useState<PendingProjectDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<{ [key: number]: boolean }>({});
  const account = useActiveAccount();

  const handleButtonClick = async (projectId: number, action: "accept" | "reject") => {
    if (!account) {
      setError("No active account found.");
      return;
    }
    setProcessing((prev) => ({ ...prev, [projectId]: true }));
    try {
      const method =
        action === "accept"
          ? "function acceptProject(uint256 _projectId)"
          : "function rejectProject(uint256 _projectId)";
      const transaction = await prepareContractCall({
        contract: projectRegistryContract,
        method,
        params: [BigInt(projectId)],
      });
      const { transactionHash } = await sendTransaction({
        transaction,
        account: account,
      });
      console.log(`${action}ed successfully:`, transactionHash);
    } catch (error) {
      console.error(`Error during ${action} project:`, error);
    } finally {
      fetchProjects();
      setProcessing((prev) => ({ ...prev, [projectId]: false }));
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/pendingProjects`);
      console.log("Full response:", response.data.projects);
      setPendingProjects(response.data.projects);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [account]);

  if (loading) {
    return (
      <div>
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-6 w-full" />
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableCell>Verification ID</TableCell>
          <TableCell>Data</TableCell>
          <TableCell>Carbon Removed</TableCell>
          <TableCell>Actions</TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pendingProjects.length > 0 ? (
          pendingProjects.map((project) => (
            <TableRow key={project.verificationId}>
              <TableCell>{project.verificationId}</TableCell>
              <TableCell className="text-center align-middle">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={() => window.open(`https://ipfs.io/ipfs/${project.ipfsCID}/`, "_blank")}>
                  <FileText className="h-4 w-4" />
                  View Data
                </Button>
              </TableCell>
              <TableCell>{project.carbonRemoved ?? 0}</TableCell>
              <TableCell>
                <button
                  className="btn btn-success mr-2"
                  onClick={() => handleButtonClick(project.projectId, "accept")}
                  disabled={processing[project.projectId]}>
                  {processing[project.projectId] ? "Processing..." : "Accept"}
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleButtonClick(project.projectId, "reject")}
                  disabled={processing[project.projectId]}>
                  {processing[project.projectId] ? "Processing..." : "Reject"}
                </button>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={5} className="text-center">
              No projects found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default PendingProjectsTable;
