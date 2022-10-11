import { NetworkInfo, WalletProvider } from "@xpla/wallet-provider";
import { ReactChildren } from "react";

const testnet: NetworkInfo = {
  name: "testnet",
  chainID: "cube_47-5",
  lcd: "https://cube-lcd.xpla.dev",
  walletconnectID: 0,
};

const walletConnectChainIds: Record<number, NetworkInfo> = {
  0: testnet,
};

export const XplaWalletProvider = ({
  children,
}: {
  children: ReactChildren;
}) => {
  return (
    <WalletProvider
      defaultNetwork={testnet}
      walletConnectChainIds={walletConnectChainIds}
    >
      {children}
    </WalletProvider>
  );
};

export default XplaWalletProvider;
