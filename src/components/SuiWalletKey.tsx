import { useCallback, useEffect, useState } from "react";
import { useSuiContext } from "../contexts/SuiWalletContext";
import SuiConnectWalletDialog from "./SuiConnectWalletDialog";
import ToggleConnectedButton from "./ToggleConnectedButton";

const SuiWalletKey = () => {
  const { connected, disconnect, getAccounts } = useSuiContext();
  // const address = (await getAccounts())[0];
  const [address, setAddress] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const fn = async () => {
      const accounts = await getAccounts();
      setAddress(accounts[0]);
    };
    fn();
  }, []);

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
