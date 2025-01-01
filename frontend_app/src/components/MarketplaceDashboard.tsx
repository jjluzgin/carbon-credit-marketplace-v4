import { useActiveAccount } from "thirdweb/react";
import { NavBar } from "./NavBar";
import { Card, CardContent } from "./ui/card";
import { Wallet, Store, ClipboardCheck, Coins } from "lucide-react";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "./ui/tabs";
import SubmitProjectCard from "./SubmitProjectCard";
import { useCallback, useEffect, useState } from "react";
import { Address, readContract } from "thirdweb";
import {
  projectRegistryContract,
  auditorRole,
  projectOwnerRole,
  tokenManagerRole,
  carbonTokenContract,
} from "@/constants/constants";
import UserProjectsTable from "./UserProjectsTable";
import PendingProjectsTable from "./PendingProjectsTable";
import IssueCreditsComponent from "./IssueCreditsComponent";
import UserCreditsTable from "./UserCreditsTable";
import CreateSellOrder from "./CreateSellOrder";
import UserSellOrders from "./UserSellOrders";
import SellOrdersStore from "./SellOrdersStore";

export default function MarketplaceDashboard() {
  const account = useActiveAccount();
  const [isAuditor, setIsAuditor] = useState(false);
  const [IsProjectOwner, setIsProjectOwner] = useState(false);
  const [isTokenManager, setIsTokenManager] = useState(false);

  const checkProjectRegistryRole = useCallback(
    async (roleHash: Address, setState: (value: boolean) => void) => {
      if (!account) return;
      try {
        const data = await readContract({
          contract: projectRegistryContract,
          method: "function hasRole(bytes32 role, address account) view returns (bool)",
          params: [roleHash, account.address],
        });
        setState(data);
      } catch (error) {
        setState(false);
        console.error("Error checking role:", error);
      }
    },
    [account],
  );

  const checkTokenManagerRole = useCallback(async () => {
    if (!account) return;
    try {
      const data = await readContract({
        contract: carbonTokenContract,
        method: "function hasRole(bytes32 role, address account) view returns (bool)",
        params: [tokenManagerRole, account.address],
      });
      setIsTokenManager(data);
    } catch (error) {
      setIsTokenManager(false);
      console.error("Error checking role:", error);
    }
  }, [account]);

  useEffect(() => {
    const checkRoles = async () => {
      await Promise.all([
        checkProjectRegistryRole(auditorRole, setIsAuditor),
        checkProjectRegistryRole(projectOwnerRole, setIsProjectOwner),
        checkTokenManagerRole(),
      ]);
    };
    if (account) checkRoles();
  }, [account, checkProjectRegistryRole, checkTokenManagerRole]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <div className="container mx-auto p-4">
        <NavBar />
      </div>

      <div className="container mx-auto p-4 flex-grow">
        <Tabs defaultValue="marketplace" className="space-y-4">
          <TabsList className="w-full justify-start gap-4 h-14 px-4">
            <TabsTrigger value="marketplace" className="gap-2">
              <Store className="w-4 h-4" />
              Marketplace
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="gap-2">
              <Wallet className="w-4 h-4" />
              My Portfolio
            </TabsTrigger>
            {(IsProjectOwner || isAuditor) && (
              <TabsTrigger value="projects" className="gap-2">
                <ClipboardCheck className="w-4 h-4" />
                Projects
              </TabsTrigger>
            )}
            {isTokenManager && (
              <TabsTrigger value="management" className="gap-2">
                <Coins className="w-4 h-4" />
                Token Management
              </TabsTrigger>
            )}
          </TabsList>

          {/* Marketplace Tab */}
          <TabsContent value="marketplace" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Available Credits</h2>
                    <SellOrdersStore />
                  </CardContent>
                </Card>
              </div>
              <div>
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Create Sell Order</h2>
                    <CreateSellOrder />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio">
            <Card>
              <CardContent className="p-6">
                <Tabs defaultValue="tokens" className="space-y-6">
                  <TabsList>
                    <TabsTrigger value="tokens">My Tokens</TabsTrigger>
                    <TabsTrigger value="orders">My Sell Orders</TabsTrigger>
                  </TabsList>

                  <TabsContent value="tokens">
                    <UserCreditsTable />
                  </TabsContent>

                  <TabsContent value="orders">
                    <div className="space-y-6">
                      <UserSellOrders />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projects Tab */}
          {(IsProjectOwner || isAuditor) && (
            <TabsContent value="projects" className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <Tabs defaultValue={IsProjectOwner ? "my-projects" : "to-review"}>
                    <TabsList>
                      {IsProjectOwner && <TabsTrigger value="my-projects">My Projects</TabsTrigger>}
                      {isAuditor && <TabsTrigger value="to-review">Projects To Review</TabsTrigger>}
                    </TabsList>
                    <TabsContent value="my-projects">
                      <UserProjectsTable />
                    </TabsContent>
                    <TabsContent value="to-review">
                      <PendingProjectsTable />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Token Management Tab */}
          {isTokenManager && (
            <TabsContent value="management">
              <Card>
                <CardContent className="p-6">
                  <IssueCreditsComponent />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
