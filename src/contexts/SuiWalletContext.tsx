import { WalletStandardAdapterProvider } from "@mysten/wallet-adapter-all-wallets";
import { useWallet, WalletProvider } from "@mysten/wallet-adapter-react";
import { ReactChildren, useEffect, useMemo, useState } from "react";

export const useSuiContext = () => {
  const [accounts, setAccounts] = useState<string[]>([]);
  const { wallet, select, wallets, connected, disconnect, getAccounts } =
    useWallet();

  useEffect(() => {
    let isCancelled = false;
    if (wallet) {
      wallet.getAccounts().then((accounts) => {
        if (!isCancelled) {
          setAccounts(accounts);
        }
      });
    }
    return () => {
      isCancelled = true;
    };
  }, [wallet]);

  return {
    wallet,
    accounts,
    select,
    wallets,
    connected,
    disconnect,
    getAccounts,
  };
};

export const SuiWalletProvider = ({
  children,
}: {
  children: ReactChildren;
}) => {
  const adapters = useMemo(() => [new WalletStandardAdapterProvider()], []);
  return <WalletProvider adapters={adapters}>{children}</WalletProvider>;
};

export default SuiWalletProvider;
