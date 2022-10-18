import { useState, useCallback } from "react";
import { useInjectiveContext } from "../contexts/InjectiveWalletContext";
import InjectiveConnectWalletDialog from "./InjectiveConnectWalletDialog";
import ToggleConnectedButton from "./ToggleConnectedButton";

const InjectiveWalletKey = () => {
  const { disconnect, address } = useInjectiveContext();
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
      <InjectiveConnectWalletDialog
        isOpen={isDialogOpen}
        onClose={closeDialog}
      />
    </>
  );
};

export default InjectiveWalletKey;
