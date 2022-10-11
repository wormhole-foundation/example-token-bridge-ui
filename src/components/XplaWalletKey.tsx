import { useConnectedWallet, useWallet } from "@xpla/wallet-provider";
import { useCallback, useState } from "react";
import XplaConnectWalletDialog from "./XplaConnectWalletDialog";
import ToggleConnectedButton from "./ToggleConnectedButton";

const XplaWalletKey = () => {
  const wallet = useWallet();
  const connectedWallet = useConnectedWallet();

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
        disconnect={wallet.disconnect}
        connected={!!connectedWallet}
        pk={connectedWallet?.xplaAddress || ""}
      />
      <XplaConnectWalletDialog isOpen={isDialogOpen} onClose={closeDialog} />
    </>
  );
};

export default XplaWalletKey;
