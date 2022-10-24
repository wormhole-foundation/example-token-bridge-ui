import { useCallback, useState } from "react";
import { useAptosContext } from "../contexts/AptosWalletContext";
import AptosConnectWalletDialog from "./AptosConnectWalletDialog";
import ToggleConnectedButton from "./ToggleConnectedButton";

const AptosWalletKey = () => {
  const { connected, disconnect, account } = useAptosContext();
  const address = account?.address?.toString();
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
        connected={connected && !!address}
        pk={address || ""}
      />
      <AptosConnectWalletDialog isOpen={isDialogOpen} onClose={closeDialog} />
    </>
  );
};

export default AptosWalletKey;
