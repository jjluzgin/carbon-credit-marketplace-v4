import { useActiveAccount } from "thirdweb/react";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { carbonTokenContract } from "@/constants/constants";
import { prepareContractCall, readContract, sendTransaction } from "thirdweb";
import { Card } from "./ui/card";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "./ui/table";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import RetireButton from "./RetireButton";

interface TokenBalance {
  tokenId: number;
  balance: number;
}

const UserTokens: React.FC = () => {
  const account = useActiveAccount();
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toggl, setToggl] = useState<boolean>(true);

  useEffect(() => {
    if (!account) return
    const fetchTokenBalances = async () => {
      try {
        const { data } = await axios.get(`http://localhost:5000/api/userTokens/${account?.address}`);
        console.log(data.tokenIds);
        const tokenIds = data.tokenIds;
        let balances: readonly bigint[]
        if(tokenIds.length > 0){
          const accounts: string[] = Array(tokenIds.length).fill(account.address);
          balances = await readContract({
            contract: carbonTokenContract,
            method: "function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])",
            params: [accounts, tokenIds],
          });
          console.log("Balances:", balances);
        }
        const tokenBalances = tokenIds.map((id: number, index: number) => ({
          tokenId: id,
          balance: parseInt(balances[index].toString()),
        }));
        console.log(tokenBalances);
        setTokenBalances(tokenBalances);
      } catch (error) {
        console.error("Error fetching token balances:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTokenBalances();
  }, [account, toggl]);

  if (loading) {
    return (
      <div>
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-6 w-full" />
      </div>
    );
  }

  return (
    <Card className="p-4">
      <h2 className="text-xl font-semibold mb-4">Your Token Balances</h2>
      {tokenBalances.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>Token ID</TableCell>
              <TableCell>Balance</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokenBalances.map((token) => (
              <TableRow key={token.tokenId}>
                <TableCell>{token.tokenId}</TableCell>
                <TableCell>{token.balance}</TableCell>
                <TableCell>
                  <RetireButton tokenId={token.tokenId} account={account}/>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p>No token balances found.</p>
      )}
      <Button onClick={() => setToggl(!toggl)}>Refresh</Button>
    </Card>
  );
};

export default UserTokens;
