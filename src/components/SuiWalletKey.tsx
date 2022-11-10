import { useCallback, useEffect, useState } from "react";
import { useSuiContext } from "../contexts/SuiWalletContext";
import SuiConnectWalletDialog from "./SuiConnectWalletDialog";
import ToggleConnectedButton from "./ToggleConnectedButton";

const SuiWalletKey = () => {
  const { connected, disconnect, getAccounts, wallet } = useSuiContext();
  const [address, setAddress] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // TODO: can we use `accounts` instead of `getAccounts` here?
  useEffect(() => {
    (async () => {
      if (wallet) {
        const accounts = await getAccounts();
        setAddress(accounts[0]);
      } else {
        setAddress(null);
      }
    })();
  }, [wallet]);

  const connect = useCallback(() => {
    setIsDialogOpen(true);
  }, [setIsDialogOpen]);

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
  }, [setIsDialogOpen]);

  return (
    <>
      <ToggleConnectedButton
        connect={connect}
        disconnect={disconnect}
        connected={connected && !!address}
        pk={address || ""}
      />
      <SuiConnectWalletDialog isOpen={isDialogOpen} onClose={closeDialog} />
    </>
  );
};

export default SuiWalletKey;
