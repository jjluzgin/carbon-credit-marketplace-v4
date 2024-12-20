import { useActiveAccount } from "thirdweb/react";
import { NavBar } from "./NavBar";
import { Card,CardHeader,CardTitle,CardContent,CardFooter } from "./ui/card";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "./ui/tabs";
import ProjectSubmissionCard from "./ProjectSubmissionCard";
import { useCallback, useEffect, useState } from "react";
import { Address, readContract } from "thirdweb";
import {
  projectRegistryContract,
  auditorRole,
  projectOwnerRole,
} from "@/constants/constants";
import UserProjectsTable from "./UserProjectsTable";
import PendingProjectsTable from "./PendingProjectsTable";
import IssueCreditsCard from "./IssueCreditsCard";
import UserTokens from "./UserTokens";

export default function MarketplaceDashboard() {
  const account = useActiveAccount();

  const [isAuditor, setIsAuditor] = useState(false);
  const [IsProjectOwner, setIsProjectOwner] = useState(false);

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
    const checkRoles = async () => {
      await Promise.all([
        checkRole(auditorRole, setIsAuditor),
        checkRole(projectOwnerRole, setIsProjectOwner),
      ]);
    };
    if (account) checkRoles();
  }, [account, checkRole]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Navigation Bar */}
      <div className="container mx-auto p-4">
        <NavBar />
      </div>

      {/* Page Content */}
      <div className="container mx-auto grid grid-rows-2 gap-4 p-4 flex-grow">
        {/* First Row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <UserTokens/>
          </div>
          <div className="col-span-2 bg-white rounded-lg shadow p-4">
            {/* ShadCN Card with Tabs */}
            <Card>
              <CardHeader>
                <CardTitle>Project Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs className="w-full">
                  {/* Tab List */}
                  <TabsList className="flex gap-2">
                    {IsProjectOwner && <TabsTrigger value="submit">Submit Project</TabsTrigger>}
                    {IsProjectOwner && <TabsTrigger value="my-projects">My Projects</TabsTrigger>}
                    {isAuditor && <TabsTrigger value="to-review">Projects To Review</TabsTrigger>}
                    {isAuditor && <TabsTrigger value="mint">Mint Tokens</TabsTrigger>}
                  </TabsList>

                  {/* Tab Contents */}
                  <TabsContent value="submit">
                    <ProjectSubmissionCard/>
                  </TabsContent>
                  <TabsContent value="my-projects">
                    <UserProjectsTable/>
                  </TabsContent>
                  <TabsContent value="to-review">
                    <PendingProjectsTable/>
                  </TabsContent>
                  <TabsContent value="mint">
                    <IssueCreditsCard/>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 bg-white rounded-lg shadow p-4"></div>
          <div className="bg-white rounded-lg shadow p-4"></div>
        </div>
      </div>
    </div>
  );
}
