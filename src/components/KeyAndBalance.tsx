import {
  ChainId,
  CHAIN_ID_ALGORAND,
  CHAIN_ID_APTOS,
  CHAIN_ID_INJECTIVE,
  CHAIN_ID_NEAR,
  CHAIN_ID_SOLANA,
  CHAIN_ID_SUI,
  CHAIN_ID_XPLA,
  isEVMChain,
  isTerraChain,
  CHAIN_ID_SEI,
} from "@certusone/wormhole-sdk";
import AlgorandWalletKey from "./AlgorandWalletKey";
import AptosWalletKey from "./AptosWalletKey";
import EthereumSignerKey from "./EthereumSignerKey";
import InjectiveWalletKey from "./InjectiveWalletKey";
import NearWalletKey from "./NearWalletKey";
import SolanaWalletKey from "./SolanaWalletKey";
import SuiWalletKey from "./SuiWalletKey";
import TerraWalletKey from "./TerraWalletKey";
import XplaWalletKey from "./XplaWalletKey";
import SeiWalletKey from "./SeiWalletKey";

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
  if (chainId === CHAIN_ID_APTOS) {
    return <AptosWalletKey />;
  }
  if (chainId === CHAIN_ID_INJECTIVE) {
    return <InjectiveWalletKey />;
  }
  if (chainId === CHAIN_ID_SEI) {
    return <SeiWalletKey />;
  }
  if (chainId === CHAIN_ID_NEAR) {
    return <NearWalletKey />;
  }
  if (chainId === CHAIN_ID_SUI) {
    return <SuiWalletKey />;
  }
  return null;
}

export default KeyAndBalance;
