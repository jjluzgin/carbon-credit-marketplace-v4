import { Table, TableHeader, TableRow, TableCell, TableBody } from "./ui/table";
import React, { useEffect, useState } from "react";
import { ProjectInfoDto } from "../../../shared/types/ProjectDto";
import axios from "axios";
import { Skeleton } from "./ui/skeleton";
import { useActiveAccount } from "thirdweb/react";

const UserProjectsTable: React.FC = () => {
  const [projects, setProjects] = useState<ProjectInfoDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const owner = useActiveAccount();

  useEffect(() => {
    if (!owner?.address) {
      setLoading(false);
      setError("No active account found.");
      return;
    }
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

    fetchProjects();
  }, [owner]);

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
          <TableCell className="text-center">Verification ID</TableCell>
          <TableCell className="text-center">Status</TableCell>
          <TableCell className="text-center">Data</TableCell>
          <TableCell className="text-center">Carbon Removed</TableCell>
          <TableCell className="text-center">Credits Issued</TableCell>
          <TableCell className="text-center">Authentication Date</TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.length > 0 ? (
          projects.map((project) => (
            <TableRow key={project.verificationId}>
              <TableCell className="text-center align-middle">{project.verificationId}</TableCell>
              <TableCell className="text-center align-middle">{project.status}</TableCell>
              <TableCell className="text-center align-middle">{project.ipfsCID}</TableCell>
              <TableCell className="text-center align-middle">{project.carbonRemoved}</TableCell>
              <TableCell className="text-center align-middle">{project.creditsIssued}</TableCell>
              <TableCell className="text-center align-middle">
                {project.authenticationDate === 0
                  ? "waiting"
                  : new Date(project.authenticationDate).toLocaleDateString()}
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

export default UserProjectsTable;
