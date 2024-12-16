import { useState } from "react";
import { client } from "@/app/client";
import { baseChain, projectRegistryContract } from "@/constants/constants";
import { ConnectButton, lightTheme, useActiveAccount } from "thirdweb/react";
import { readContract } from "thirdweb";

export function NavBar(){
    const address = useActiveAccount();
    const [hasRole, setHasRole] = useState<null | boolean>(null); // State to hold the result
    const roleHash = "0x770fadb28e0e3026382976ee8b810cb0eb8666922148dd9e10b20cfb9b477ba8";

    const checkRole = async () => {
        if(!address){
            alert("Please connect your wallet first.");
            return;
        }
        try{
            const data = await readContract({
                contract: projectRegistryContract,
                method: "function hasRole(bytes32 role, address account) view returns (bool)",
                params: [roleHash, address.address],
            });
            setHasRole(data);
        } catch (error) {
            console.error("Error checking role:", error);
            alert("Failed to check role.");
        }
    }

    return(
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Carbon Credits Marketplace</h1>
            <div className="items-center flex gap-2">
                <p>{address?.address}</p>
                <ConnectButton
                    client={client}
                    // wallets={wallets}
                    theme={lightTheme()}
                    chain={baseChain}
                    connectButton={{
                        label: "Sign In",
                        style: {
                            fontSize: '0.75rem !important',
                            height: '2.5rem !important'
                        }
                    }}
                    // accountAbstraction={{
                    //     chain: baseChain,
                    //     sponsorGas: true,
                    // }}
                    // Comment in to showcase your own token balance
                    // detailsButton={{
                    //     displayBalanceToken:{
                    //         [baseChain.id]: carbonTokenContractAddress
                    //     }
                    // }}
                />

                {/* Role Check Button */}
                <button
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    onClick={checkRole}
                >
                    Check Role
                </button>

                {/* Role Check Result */}
                {hasRole !== null && (
                    <p className="text-sm">
                        {hasRole
                            ? "You have the required role!"
                            : "You do not have the required role."}
                    </p>
                )}
            </div>
        </div>
    )
}