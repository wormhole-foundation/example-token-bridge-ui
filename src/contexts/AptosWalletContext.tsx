import {
  createContext,
  ReactChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { getAptosWallet } from "../utils/aptos";

interface IAptosProviderContext {
  connect(): void;
  disconnect(): void;
  address: any;
  network: any;
}

const AptosProviderContext = createContext<IAptosProviderContext>({
  connect: () => {},
  disconnect: () => {},
  address: undefined,
  network: undefined,
});

export const AptosWalletProvider = ({
  children,
}: {
  children: ReactChildren;
}) => {
  const [address, setAddress] = useState<any>(undefined);
  const [network, setNetwork] = useState<any>(undefined);
  const connect = useCallback(() => {
    const wallet = getAptosWallet();
    let cancelled = false;
    (async () => {
      try {
        await wallet.connect();
        const account = await wallet.account();
        const network = await wallet.network();
        wallet.onAccountChange((newAccount: any) => {
          const address =
            (typeof newAccount === "string"
              ? newAccount
              : newAccount?.address) || undefined;
          setAddress(address);
        });
        wallet.onNetworkChange((newNetwork: any) => {
          const networkName =
            typeof newNetwork === "string"
              ? newNetwork
              : newNetwork.networkName;
          setNetwork(networkName);
        });
        // martian doesn't support this
        try {
          wallet.onDisconnect(() => {
            setAddress(undefined);
            setNetwork(undefined);
          });
        } catch (e) {}
        if (!cancelled) {
          setAddress(account.address);
          setNetwork(network);
        }
      } catch (e) {
        console.error(e);
        // { code: 4001, message: "User rejected the request" }
      }
    })();
  }, []);
  const disconnect = useCallback(() => {
    const wallet = getAptosWallet();
    (async () => {
      try {
        await wallet.disconnect();
      } catch (e) {}
      setAddress(undefined);
    })();
  }, []);
  const contextValue = useMemo(
    () => ({
      connect,
      disconnect,
      address,
      network,
    }),
    [connect, disconnect, address, network]
  );
  return (
    <AptosProviderContext.Provider value={contextValue}>
      {children}
    </AptosProviderContext.Provider>
  );
};

export default AptosWalletProvider;

export const useAptosContext = () => {
  return useContext(AptosProviderContext);
};
