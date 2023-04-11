import {
  ChainId,
  CHAIN_ID_ALGORAND,
  CHAIN_ID_AURORA,
  CHAIN_ID_AVAX,
  CHAIN_ID_BSC,
  CHAIN_ID_CELO,
  CHAIN_ID_ETH,
  CHAIN_ID_FANTOM,
  CHAIN_ID_KLAYTN,
  CHAIN_ID_KARURA,
  CHAIN_ID_NEAR,
  CHAIN_ID_MOONBEAM,
  CHAIN_ID_OASIS,
  CHAIN_ID_POLYGON,
  CHAIN_ID_SOLANA,
  CHAIN_ID_ACALA,
  isTerraChain,
  CHAIN_ID_TERRA2,
  CHAIN_ID_XPLA,
  CHAIN_ID_APTOS,
  CHAIN_ID_ARBITRUM,
  CHAIN_ID_INJECTIVE,
  CHAIN_ID_BASE,
  CHAIN_ID_OPTIMISM,
  CHAIN_ID_SEPOLIA,
  CHAIN_ID_SUI,
} from "@certusone/wormhole-sdk";
import { Button, makeStyles, Typography } from "@material-ui/core";
import { Transaction } from "../store/transferSlice";
import { CLUSTER, getExplorerName } from "../utils/consts";

const useStyles = makeStyles((theme) => ({
  tx: {
    marginTop: theme.spacing(1),
    textAlign: "center",
  },
  viewButton: {
    marginTop: theme.spacing(1),
  },
}));

export default function ShowTx({
  chainId,
  tx,
}: {
  chainId: ChainId;
  tx: Transaction;
}) {
  const classes = useStyles();
  const showExplorerLink =
    CLUSTER === "testnet" ||
    (CLUSTER === "devnet" &&
      (chainId === CHAIN_ID_SOLANA || isTerraChain(chainId)));
  const explorerAddress =
    chainId === CHAIN_ID_ETH
      ? `https://${CLUSTER === "testnet" ? "goerli." : ""}etherscan.io/tx/${
          tx?.id
        }`
      : chainId === CHAIN_ID_SEPOLIA
      ? `https://${CLUSTER === "testnet" ? "sepolia." : ""}etherscan.io/tx/${
          tx?.id
        }`
      : chainId === CHAIN_ID_BSC
      ? `https://${CLUSTER === "testnet" ? "testnet." : ""}bscscan.com/tx/${
          tx?.id
        }`
      : chainId === CHAIN_ID_POLYGON
      ? `https://${CLUSTER === "testnet" ? "mumbai." : ""}polygonscan.com/tx/${
          tx?.id
        }`
      : chainId === CHAIN_ID_AVAX
      ? `https://${CLUSTER === "testnet" ? "testnet." : ""}snowtrace.io/tx/${
          tx?.id
        }`
      : chainId === CHAIN_ID_OASIS
      ? `https://${
          CLUSTER === "testnet" ? "testnet." : ""
        }explorer.emerald.oasis.dev/tx/${tx?.id}`
      : chainId === CHAIN_ID_AURORA
      ? `https://${CLUSTER === "testnet" ? "testnet." : ""}aurorascan.dev/tx/${
          tx?.id
        }`
      : chainId === CHAIN_ID_FANTOM
      ? `https://${CLUSTER === "testnet" ? "testnet." : ""}ftmscan.com/tx/${
          tx?.id
        }`
      : chainId === CHAIN_ID_KLAYTN
      ? `https://${CLUSTER === "testnet" ? "baobab." : ""}scope.klaytn.com/tx/${
          tx?.id
        }`
      : chainId === CHAIN_ID_CELO
      ? `https://${
          CLUSTER === "testnet" ? "alfajores.celoscan.io" : "explorer.celo.org"
        }/tx/${tx?.id}`
      : chainId === CHAIN_ID_KARURA
      ? `https://${
          CLUSTER === "testnet"
            ? "blockscout.karura-dev.aca-dev.network"
            : "blockscout.karura.network"
        }/tx/${tx?.id}`
      : chainId === CHAIN_ID_ACALA
      ? `https://${
          CLUSTER === "testnet"
            ? "blockscout.acala-dev.aca-dev.network"
            : "blockscout.acala.network"
        }/tx/${tx?.id}`
      : chainId === CHAIN_ID_SOLANA
      ? `https://solscan.io/tx/${tx?.id}${
          CLUSTER === "testnet"
            ? "?cluster=devnet"
            : CLUSTER === "devnet"
            ? "?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899"
            : ""
        }`
      : chainId === CHAIN_ID_TERRA2
      ? `https://finder.terra.money/${
          CLUSTER === "devnet"
            ? "localterra"
            : CLUSTER === "testnet"
            ? "pisco-1"
            : "phoenix-1"
        }/tx/${tx?.id}`
      : chainId === CHAIN_ID_ALGORAND
      ? `https://${CLUSTER === "testnet" ? "testnet." : ""}algoexplorer.io/tx/${
          tx?.id
        }`
      : chainId === CHAIN_ID_MOONBEAM
      ? `https://${CLUSTER === "testnet" ? "moonbase." : ""}moonscan.io/tx/${
          tx?.id
        }`
      : chainId === CHAIN_ID_BASE
      ? `https://${CLUSTER === "testnet" ? "goerli." : ""}basescan.org/tx/${
          tx?.id
        }`
      : chainId === CHAIN_ID_OPTIMISM
      ? `https://${
          CLUSTER === "testnet" ? "goerli-" : ""
        }optimism.etherscan.io/tx/${tx?.id}`
      : chainId === CHAIN_ID_XPLA
      ? `https://explorer.xpla.io/${
          CLUSTER === "testnet" ? "testnet/" : ""
        }tx/${tx?.id}`
      : chainId === CHAIN_ID_ARBITRUM
      ? `https://${CLUSTER === "testnet" ? "goerli." : ""}arbiscan.io/tx/${
          tx?.id
        }`
      : chainId === CHAIN_ID_APTOS
      ? `https://explorer.aptoslabs.com/txn/${tx?.id}${
          CLUSTER === "testnet"
            ? "?network=testnet"
            : CLUSTER === "devnet"
            ? "?network=local"
            : ""
        }`
      : chainId === CHAIN_ID_SUI
      ? `https://explorer.sui.io/txblock/${tx?.id}${
          CLUSTER === "testnet"
            ? "?network=testnet"
            : CLUSTER === "devnet"
            ? "?network=local"
            : ""
        }`
      : chainId === CHAIN_ID_INJECTIVE
      ? `https://testnet.explorer.injective.network/transaction/${tx.id}`
      : chainId === CHAIN_ID_NEAR && CLUSTER === "testnet"
      ? `https://explorer.testnet.near.org/transactions/${tx?.id}`
      : undefined;
  const explorerName = getExplorerName(chainId);

  return (
    <div className={classes.tx}>
      <Typography noWrap component="div" variant="body2">
        {tx.id}
      </Typography>
      {showExplorerLink && explorerAddress ? (
        <Button
          href={explorerAddress}
          target="_blank"
          rel="noopener noreferrer"
          size="small"
          variant="outlined"
          className={classes.viewButton}
        >
          View on {explorerName}
        </Button>
      ) : null}
    </div>
  );
}
