import { useNearContext } from "../contexts/NearWalletContext";
import ToggleConnectedButton from "./ToggleConnectedButton";

const NearWalletKey = () => {
  const { connect, disconnect, accountId: activeAccount } = useNearContext();

  return (
    <ToggleConnectedButton
      connect={connect}
      disconnect={disconnect}
      connected={!!activeAccount}
      pk={activeAccount || ""}
    />
  );
};

export default NearWalletKey;
