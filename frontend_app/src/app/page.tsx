"use client";
import MarketplaceDashboard from "@/components/MarketplaceDashboard";
import { useActiveAccount, lightTheme } from "thirdweb/react";
import { ConnectButton, ConnectEmbed } from "thirdweb/react";
import { baseChain } from "@/constants/constants";
import { client } from "./client";

export default function Home() {
  const account = useActiveAccount();

  if (!account) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Welcome to the Carbon Marketplace</h1>
        <p className="text-gray-600">Please connect your wallet to continue</p>
        <ConnectEmbed
          client={client}
          // wallets={wallets}
          theme={lightTheme()}
          chain={baseChain}
        />
      </div>
    );
  }

  return <MarketplaceDashboard />;
}