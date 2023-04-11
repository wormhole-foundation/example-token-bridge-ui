import { useCallback, useState } from "react";
import SuiConnectWalletDialog from "./SuiConnectWalletDialog";
import ToggleConnectedButton from "./ToggleConnectedButton";
import { useWallet } from "@suiet/wallet-kit";

const SuiWalletKey = () => {
  const { connected, address, disconnect } = useWallet();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const connect = useCallback(() => {
    setIsDialogOpen(true);
  }, [setIsDialogOpen]);

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
  }, [setIsDialogOpen]);

  const onDisconnect = useCallback(() => {
    disconnect().catch((e) => console.error(e));
  }, [disconnect]);

  return (
    <>
      <ToggleConnectedButton
        connect={connect}
        disconnect={onDisconnect}
        connected={connected && !!address}
        pk={address || ""}
      />
      <SuiConnectWalletDialog isOpen={isDialogOpen} onClose={closeDialog} />
    </>
  );
};

export default SuiWalletKey;
