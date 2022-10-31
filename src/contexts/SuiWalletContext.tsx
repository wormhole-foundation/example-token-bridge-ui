import { WalletProvider } from "@suiet/wallet-kit";
import { ReactChildren } from "react";

// export const useSuiContext = () => {
//   const [accounts, setAccounts] = useState<string[]>([]);
//   const { select, wallets, connected, disconnect, getAccounts } = useWallet();

//   useEffect(() => {
//     let isCancelled = false;
//     if (wallet) {
//       wallet.getAccounts().then((accounts) => {
//         if (!isCancelled) {
//           setAccounts(accounts);
//         }
//       });
//     }
//     return () => {
//       isCancelled = true;
//     };
//   }, [wallet]);

//   return {
//     wallet,
//     accounts,
//     select,
//     wallets,
//     connected,
//     disconnect,
//     getAccounts,
//   };
// };

export const SuiWalletProvider = ({
  children,
}: {
  children: ReactChildren;
}) => {
  return <WalletProvider autoConnect={false}> {children}</WalletProvider>;
};

export default SuiWalletProvider;
