import { Table, TableHeader, TableRow, TableCell, TableBody } from "./ui/table";
import React, { useEffect, useState } from "react";
import { UserProjectDto } from "../../../shared/types/ProjectDto";
import axios from "axios";
import { Skeleton } from "./ui/skeleton";
import { useActiveAccount } from "thirdweb/react";

const UserProjectsTable: React.FC = () => {
  const [projects, setProjects] = useState<UserProjectDto[]>([]);
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
        console.log('Full response:', response.data.projects);
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
          <TableCell>Verification ID</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Data</TableCell>
          <TableCell>Carbon Removed</TableCell>
          <TableCell>Credits Issued</TableCell>
          <TableCell>Authentication Date</TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.length > 0 ? (
          projects.map((project) => (
            <TableRow key={project.verificationId}>
              <TableCell>{project.verificationId}</TableCell>
              <TableCell>{project.status}</TableCell>
              <TableCell>{project.ipfsCID}</TableCell>
              <TableCell>{project.carbonRemoved}</TableCell>
              <TableCell>{project.creditsIssued}</TableCell>
              <TableCell>{project.authenticationDate === 0 ? "waiting" : new Date(project.authenticationDate).toLocaleDateString()}</TableCell>
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
