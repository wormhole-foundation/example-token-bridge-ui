import { WalletStandardAdapterProvider } from "@mysten/wallet-adapter-all-wallets";
import { useWallet, WalletProvider } from "@mysten/wallet-adapter-react";
import { ReactChildren, useMemo } from "react";

export const useSuiContext = useWallet;

export const SuiWalletProvider = ({
  children,
}: {
  children: ReactChildren;
}) => {
  const adapters = useMemo(() => [new WalletStandardAdapterProvider()], []);
  return <WalletProvider adapters={adapters}>{children}</WalletProvider>;
};

export default SuiWalletProvider;
