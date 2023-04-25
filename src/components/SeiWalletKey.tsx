import { useWallet } from "@sei-js/react";
import { useCallback, useState } from "react";
import SeiConnectWalletDialog from "./SeiConnectWalletDialog";
import ToggleConnectedButton from "./ToggleConnectedButton";

const SeiWalletKey = () => {
  const { disconnect, accounts } = useWallet();
  const address = accounts.length ? accounts[0].address : null;
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
        connected={!!address}
        pk={address || ""}
      />
      <SeiConnectWalletDialog isOpen={isDialogOpen} onClose={closeDialog} />
    </>
  );
};

export default SeiWalletKey;
