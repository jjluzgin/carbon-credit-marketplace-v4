import { Table, TableHeader, TableRow, TableCell, TableBody } from "./ui/table";
import React, { useEffect, useState } from "react";
import { PendingProjectDto } from "../../../shared/types/ProjectDto";
import axios from "axios";
import { Skeleton } from "./ui/skeleton";
import { useActiveAccount } from "thirdweb/react";
import { projectRegistryContract } from "@/constants/constants";
import { prepareContractCall, sendTransaction } from "thirdweb";
import { Button } from "./ui/button";
import { AlertCircle, FileText, RefreshCw, ThumbsDown, ThumbsUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";

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
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Pending Carbon Projects</CardTitle>
            <CardDescription>View and manage pending carbon removal projects</CardDescription>
          </div>
          <>
            <Button variant="outline" onClick={fetchProjects} disabled={loading} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : loading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell className="font-semibold text-gray-700">Verification ID</TableCell>
                  <TableCell className="font-semibold text-gray-700 text-center">Data</TableCell>
                  <TableCell className="font-semibold text-gray-700 text-center">Carbon Removed</TableCell>
                  <TableCell className="font-semibold text-gray-700 text-center">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingProjects.length > 0 ? (
                  pendingProjects.map((project) => (
                    <TableRow key={project.verificationId}>
                      <TableCell className="align-middle">{project.verificationId}</TableCell>
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
                      <TableCell className="text-center align-middle">{project.carbonRemoved ?? 0}</TableCell>
                      <TableCell className="text-center align-middle">
                        {processing[project.projectId] ? (
                          <span className="text-gray-500 font-semibold">Processing...</span>
                        ) : (
                          <>
                            <button
                              className="btn btn-success mr-2"
                              onClick={() =>
                                confirm(`Accepting project ${project.verificationId}?`) &&
                                handleButtonClick(project.projectId, "accept")
                              }
                              disabled={processing[project.projectId]}>
                              <ThumbsUp />
                            </button>
                            <button
                              className="btn btn-danger"
                              onClick={() =>
                                confirm(`Rejecting project ${project.verificationId}?`) &&
                                handleButtonClick(project.projectId, "reject")
                              }
                              disabled={processing[project.projectId]}>
                              <ThumbsDown />
                            </button>
                          </>
                        )}
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
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingProjectsTable;
