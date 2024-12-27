import { Table, TableHeader, TableRow, TableCell, TableBody, TableHead } from "./ui/table";
import React, { useEffect, useState } from "react";
import { ProjectInfoDto } from "../../../shared/types/ProjectDto";
import axios from "axios";
import { Skeleton } from "./ui/skeleton";
import { useActiveAccount } from "thirdweb/react";
import { Alert, AlertDescription } from "./ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { AlertCircle, FileText, RefreshCw, Wallet, Minus } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

const UserProjectsTable: React.FC = () => {
  const [projects, setProjects] = useState<ProjectInfoDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const owner = useActiveAccount();

  const getStatusBadge = (status: number) => {
    const statusConfig = {
      0: { label: "Pending", className: "bg-orange-500 hover:bg-orange-600" },
      1: { label: "Audited", className: "bg-green-500 hover:bg-green-600" },
      2: { label: "Rejected", className: "bg-red-500 hover:bg-red-600" }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { label: "Unknown", className: "bg-gray-500 hover:bg-gray-600" };
    
    return (
      <Badge className={`${config.className} text-white`}>
        {config.label}
      </Badge>
    );
  };

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/userProjects/${owner?.address}`);
      console.log("Full response:", response.data.projects);
      setProjects(response.data.projects);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (owner?.address) {
      fetchProjects();
    } else {
      setLoading(false);
      setError("No active account found.");
    }
  }, [owner]);

  if (!owner) {
    return (
      <Alert className="bg-yellow-50 border-yellow-200">
        <Wallet className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          Please connect your wallet to view your projects.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Your Carbon Projects</CardTitle>
            <CardDescription>
              View and manage your carbon removal projects
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchProjects}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
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
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Verification ID</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Data</TableHead>
                  <TableHead className="text-center">Carbon Removed</TableHead>
                  <TableHead className="text-center">Credits Issued</TableHead>
                  <TableHead className="text-center">Authentication Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.length > 0 ? (
                  projects.map((project) => (
                    <TableRow key={project.verificationId}>
                      <TableCell className="font-medium text-center">
                        {project.verificationId}
                      </TableCell>
                      <TableCell className="text-center align-middle">
                        {getStatusBadge(project.status)}
                      </TableCell>
                      <TableCell className="text-center align-middle">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          onClick={() => window.open(`https://ipfs.io/ipfs/${project.ipfsCID}/`, '_blank')}
                        >
                          <FileText className="h-4 w-4" />
                          View Data
                        </Button>
                      </TableCell>
                      <TableCell className="text-center align-middle">
                        {project.carbonRemoved.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center align-middle">
                        {project.creditsIssued.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center align-middle">
                        {project.authenticationDate === 0 ? (
                          <></>
                        ) : (
                          new Date(project.authenticationDate * 1000).toLocaleDateString()
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      <div className="flex flex-col items-center gap-2 text-gray-500">
                        <FileText className="h-8 w-8" />
                        <p>No projects found.</p>
                        <p className="text-sm">Projects you create will appear here.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserProjectsTable;