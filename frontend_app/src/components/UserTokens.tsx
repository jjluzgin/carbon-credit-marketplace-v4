import { useActiveAccount } from "thirdweb/react";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { carbonTokenContract } from "@/constants/constants";
import { prepareContractCall, readContract, sendTransaction } from "thirdweb";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "./ui/table";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import RetireButton from "./RetireButton";
import ProjectDetailsButton from "./ProjectDetailsButton";
import { RefreshCw, Wallet, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

interface TokenBalance {
  tokenId: number;
  balance: number;
}

const UserTokens: React.FC = () => {
  const account = useActiveAccount();
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const fetchTokenBalances = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get(`http://localhost:5000/api/userTokens/${account?.address}`);
      const tokenIds = data.tokenIds;
      
      let balances: readonly bigint[] = [];
      if (tokenIds.length > 0) {
        const accounts: string[] = Array(tokenIds.length).fill(account?.address);
        balances = await readContract({
          contract: carbonTokenContract,
          method: "function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])",
          params: [accounts, tokenIds],
        });
      }
      
      const tokenBalances = tokenIds.map((id: number, index: number) => ({
        tokenId: id,
        balance: parseInt(balances[index].toString()),
      }));
      
      setTokenBalances(tokenBalances);
    } catch (error) {
      console.error("Error fetching token balances:", error);
      setError("Failed to fetch token balances. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (account) {
      fetchTokenBalances();
    }
  }, [account]);

  if (!account) {
    return (
      <Alert className="bg-yellow-50 border-yellow-200">
        <Wallet className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          Please connect your wallet to view your token balances.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Your Carbon Credits</CardTitle>
            <CardDescription className="mt-1">
              View and manage your carbon credit tokens
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTokenBalances}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : tokenBalances.length > 0 ? (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Token ID</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokenBalances.map((token) => (
                  <TableRow key={token.tokenId}>
                    <TableCell className="font-medium">#{token.tokenId}</TableCell>
                    <TableCell>{token.balance.toLocaleString()} credits</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <ProjectDetailsButton tokenId={token.tokenId} account={account} />
                        <RetireButton tokenId={token.tokenId} account={account} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Alert>
            <Wallet className="h-4 w-4" />
            <AlertDescription>
              No carbon credits found in your wallet. Once you receive credits, they will appear here.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default UserTokens;