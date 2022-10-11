import {
  ChainId,
  CHAIN_ID_ALGORAND,
  CHAIN_ID_SOLANA,
  CHAIN_ID_XPLA,
  isEVMChain,
  isTerraChain,
} from "@certusone/wormhole-sdk";
import AlgorandWalletKey from "./AlgorandWalletKey";
import EthereumSignerKey from "./EthereumSignerKey";
import SolanaWalletKey from "./SolanaWalletKey";
import TerraWalletKey from "./TerraWalletKey";
import XplaWalletKey from "./XplaWalletKey";

function KeyAndBalance({ chainId }: { chainId: ChainId }) {
  if (isEVMChain(chainId)) {
    return <EthereumSignerKey chainId={chainId} />;
  }
  if (chainId === CHAIN_ID_SOLANA) {
    return <SolanaWalletKey />;
  }
  if (isTerraChain(chainId)) {
    return <TerraWalletKey />;
  }
  if (chainId === CHAIN_ID_ALGORAND) {
    return <AlgorandWalletKey />;
  }
  if (chainId === CHAIN_ID_XPLA) {
    return <XplaWalletKey />;
  }
  return null;
}

export default KeyAndBalance;
