import { client } from "@/app/client";
import { getContract } from "thirdweb";
import { localhost } from "thirdweb/chains";
import { createWallet } from "thirdweb/wallets";

export const projectRegistryContractAddress = "0x7ef8E99980Da5bcEDcF7C10f41E55f759F6A174B";
export const carbonTokenContractAddress = "0x82B769500E34362a76DF81150e12C746093D954F";
export const marketplaceContractAddress = "0x77c7E3905c21177Be97956c6620567596492C497";

export const auditorRole = "0x59a1c48e5837ad7a7f3dcedcbe129bf3249ec4fbf651fd4f5e2600ead39fe2f5";
export const projectOwnerRole = "0x770fadb28e0e3026382976ee8b810cb0eb8666922148dd9e10b20cfb9b477ba8";

export const wallets = [
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
  createWallet("io.rabby"),
  createWallet("io.zerion.wallet"),
];

export const baseChain = localhost;

export const projectRegistryContract = getContract({
  client: client,
  chain: baseChain,
  address: projectRegistryContractAddress,
});

export const carbonTokenContract = getContract({
  client: client,
  chain: baseChain,
  address: carbonTokenContractAddress,
});

export const marketplaceContract = getContract({
  client: client,
  chain: baseChain,
  address: marketplaceContractAddress,
});
