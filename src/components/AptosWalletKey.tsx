import { useAptosContext } from "../contexts/AptosWalletContext";
import ToggleConnectedButton from "./ToggleConnectedButton";

const AptosWalletKey = () => {
  const { connect, disconnect, address } = useAptosContext();

  return (
    <>
      <ToggleConnectedButton
        connect={connect}
        disconnect={disconnect}
        connected={!!address}
        pk={address || ""}
      />
    </>
  );
};

export default AptosWalletKey;
