import {
  ChainId,
  CHAIN_ID_ACALA,
  CHAIN_ID_ALGORAND,
  CHAIN_ID_APTOS,
  CHAIN_ID_ARBITRUM,
  CHAIN_ID_AURORA,
  CHAIN_ID_AVAX,
  CHAIN_ID_BASE,
  CHAIN_ID_BSC,
  CHAIN_ID_CELO,
  CHAIN_ID_ETH,
  CHAIN_ID_FANTOM,
  CHAIN_ID_INJECTIVE,
  CHAIN_ID_KARURA,
  CHAIN_ID_KLAYTN,
  CHAIN_ID_MOONBEAM,
  CHAIN_ID_NEAR,
  CHAIN_ID_NEON,
  CHAIN_ID_OASIS,
  CHAIN_ID_OPTIMISM,
  CHAIN_ID_POLYGON,
  CHAIN_ID_SEPOLIA,
  CHAIN_ID_SOLANA,
  CHAIN_ID_SUI,
  CHAIN_ID_TERRA,
  CHAIN_ID_TERRA2,
  CHAIN_ID_XPLA,
  coalesceChainName,
  CONTRACTS,
  isEVMChain,
  isTerraChain,
  TerraChainId,
  CHAIN_ID_SEI,
  cosmos,
} from "@certusone/wormhole-sdk";
import { clusterApiUrl } from "@solana/web3.js";
import { getAddress } from "ethers/lib/utils";
import { CHAIN_CONFIG_MAP } from "../config";
import acalaIcon from "../icons/acala.svg";
import algorandIcon from "../icons/algorand.svg";
import aptosIcon from "../icons/aptos.svg";
import arbitrumIcon from "../icons/arbitrum.svg";
import auroraIcon from "../icons/aurora.svg";
import avaxIcon from "../icons/avax.svg";
import baseIcon from "../icons/base.svg";
import bscIcon from "../icons/bsc.svg";
import celoIcon from "../icons/celo.svg";
import ethIcon from "../icons/eth.svg";
import fantomIcon from "../icons/fantom.svg";
import karuraIcon from "../icons/karura.svg";
import klaytnIcon from "../icons/klaytn.svg";
import moonbeamIcon from "../icons/moonbeam.svg";
import neonIcon from "../icons/neon.svg";
import oasisIcon from "../icons/oasis-network-rose-logo.svg";
import optimismIcon from "../icons/optimism.svg";
import polygonIcon from "../icons/polygon.svg";
import seiIcon from "../icons/sei.svg";
import solanaIcon from "../icons/solana.svg";
import suiIcon from "../icons/sui.svg";
import terraIcon from "../icons/terra.svg";
import terra2Icon from "../icons/terra2.svg";
import xplaIcon from "../icons/xpla.svg";
import injectiveIcon from "../icons/injective.svg";
import { AptosNetwork } from "./aptos";
import { getNetworkInfo, Network } from "@injectivelabs/networks";
import nearIcon from "../icons/near.svg";
import { ConnectConfig, keyStores } from "near-api-js";
import { ChainConfiguration } from "@sei-js/react";
import { testnetConnection, localnetConnection } from "@mysten/sui.js";

export type Cluster = "devnet" | "testnet";
const urlParams = new URLSearchParams(window.location.search);
const paramCluster = urlParams.get("cluster");
export const CLUSTER: Cluster =
  paramCluster === "devnet" ? "devnet" : "testnet";
export interface ChainInfo {
  id: ChainId;
  name: string;
  logo: string;
}
export const CHAINS: ChainInfo[] =
  CLUSTER === "testnet"
    ? [
        {
          id: CHAIN_ID_ACALA,
          name: "Acala",
          logo: acalaIcon,
        },
        {
          id: CHAIN_ID_ALGORAND,
          name: "Algorand",
          logo: algorandIcon,
        },
        {
          id: CHAIN_ID_APTOS,
          name: "Aptos",
          logo: aptosIcon,
        },
        {
          id: CHAIN_ID_ARBITRUM,
          name: "Arbitrum",
          logo: arbitrumIcon,
        },
        {
          id: CHAIN_ID_AURORA,
          name: "Aurora",
          logo: auroraIcon,
        },
        {
          id: CHAIN_ID_AVAX,
          name: "Avalanche",
          logo: avaxIcon,
        },
        {
          id: CHAIN_ID_BASE,
          name: "Base Goerli",
          logo: baseIcon,
        },
        {
          id: CHAIN_ID_BSC,
          name: "Binance Smart Chain",
          logo: bscIcon,
        },
        {
          id: CHAIN_ID_CELO,
          name: "Celo",
          logo: celoIcon,
        },
        {
          id: CHAIN_ID_ETH,
          name: "Ethereum (Goerli)",
          logo: ethIcon,
        },
        {
          id: CHAIN_ID_SEPOLIA,
          name: "Ethereum (Sepolia)",
          logo: ethIcon,
        },
        {
          id: CHAIN_ID_FANTOM,
          name: "Fantom",
          logo: fantomIcon,
        },
        {
          id: CHAIN_ID_INJECTIVE,
          name: "Injective",
          logo: injectiveIcon,
        },
        {
          id: CHAIN_ID_KARURA,
          name: "Karura",
          logo: karuraIcon,
        },
        {
          id: CHAIN_ID_KLAYTN,
          name: "Klaytn",
          logo: klaytnIcon,
        },
        {
          id: CHAIN_ID_MOONBEAM,
          name: "Moonbeam",
          logo: moonbeamIcon,
        },
        {
          id: CHAIN_ID_NEAR,
          name: "Near",
          logo: nearIcon,
        },
        {
          id: CHAIN_ID_NEON,
          name: "Neon",
          logo: neonIcon,
        },
        {
          id: CHAIN_ID_OASIS,
          name: "Oasis",
          logo: oasisIcon,
        },
        {
          id: CHAIN_ID_OPTIMISM,
          name: "Optimism (Goerli)",
          logo: optimismIcon,
        },
        {
          id: CHAIN_ID_POLYGON,
          name: "Polygon",
          logo: polygonIcon,
        },
        {
          id: CHAIN_ID_SEI,
          name: "Sei",
          logo: seiIcon,
        },
        {
          id: CHAIN_ID_SOLANA,
          name: "Solana",
          logo: solanaIcon,
        },
        {
          id: CHAIN_ID_SUI,
          name: "Sui",
          logo: suiIcon,
        },
        {
          id: CHAIN_ID_TERRA,
          name: "Terra Classic",
          logo: terraIcon,
        },
        {
          id: CHAIN_ID_TERRA2,
          name: "Terra",
          logo: terra2Icon,
        },
        {
          id: CHAIN_ID_XPLA,
          name: "XPLA",
          logo: xplaIcon,
        },
      ]
    : [
        {
          id: CHAIN_ID_ALGORAND,
          name: "Algorand",
          logo: algorandIcon,
        },
        {
          id: CHAIN_ID_APTOS,
          name: "Aptos",
          logo: aptosIcon,
        },
        {
          id: CHAIN_ID_BSC,
          name: "Binance Smart Chain",
          logo: bscIcon,
        },
        {
          id: CHAIN_ID_ETH,
          name: "Ethereum",
          logo: ethIcon,
        },
        {
          id: CHAIN_ID_NEAR,
          name: "Near",
          logo: nearIcon,
        },
        {
          id: CHAIN_ID_SOLANA,
          name: "Solana",
          logo: solanaIcon,
        },
        {
          id: CHAIN_ID_SUI,
          name: "Sui",
          logo: suiIcon,
        },
        {
          id: CHAIN_ID_TERRA,
          name: "Terra Classic",
          logo: terraIcon,
        },
        {
          id: CHAIN_ID_TERRA2,
          name: "Terra",
          logo: terra2Icon,
        },
      ];
export const CHAINS_WITH_NFT_SUPPORT = CHAINS.filter(
  ({ id }) =>
    id === CHAIN_ID_AVAX ||
    id === CHAIN_ID_BSC ||
    id === CHAIN_ID_ETH ||
    id === CHAIN_ID_SEPOLIA ||
    id === CHAIN_ID_POLYGON ||
    id === CHAIN_ID_OASIS ||
    id === CHAIN_ID_SOLANA ||
    id === CHAIN_ID_AURORA ||
    id === CHAIN_ID_FANTOM ||
    id === CHAIN_ID_KARURA ||
    id === CHAIN_ID_ACALA ||
    id === CHAIN_ID_KLAYTN ||
    id === CHAIN_ID_CELO ||
    id === CHAIN_ID_NEON ||
    id === CHAIN_ID_ARBITRUM ||
    id === CHAIN_ID_MOONBEAM ||
    id === CHAIN_ID_BASE ||
    id === CHAIN_ID_OPTIMISM
);
export type ChainsById = { [key in ChainId]: ChainInfo };
export const CHAINS_BY_ID: ChainsById = CHAINS.reduce((obj, chain) => {
  obj[chain.id] = chain;
  return obj;
}, {} as ChainsById);

export const COMING_SOON_CHAINS: ChainInfo[] = [];
export const getDefaultNativeCurrencySymbol = (chainId: ChainId) =>
  chainId === CHAIN_ID_SOLANA
    ? "SOL"
    : chainId === CHAIN_ID_ETH || chainId === CHAIN_ID_SEPOLIA
    ? "ETH"
    : chainId === CHAIN_ID_BSC
    ? "BNB"
    : chainId === CHAIN_ID_TERRA
    ? "LUNC"
    : chainId === CHAIN_ID_TERRA2
    ? "LUNA"
    : chainId === CHAIN_ID_POLYGON
    ? "MATIC"
    : chainId === CHAIN_ID_AVAX
    ? "AVAX"
    : chainId === CHAIN_ID_OASIS
    ? "ROSE"
    : chainId === CHAIN_ID_ALGORAND
    ? "ALGO"
    : chainId === CHAIN_ID_AURORA
    ? "ETH"
    : chainId === CHAIN_ID_FANTOM
    ? "FTM"
    : chainId === CHAIN_ID_KARURA
    ? "KAR"
    : chainId === CHAIN_ID_ACALA
    ? "ACA"
    : chainId === CHAIN_ID_KLAYTN
    ? "KLAY"
    : chainId === CHAIN_ID_CELO
    ? "CELO"
    : chainId === CHAIN_ID_NEON
    ? "NEON"
    : chainId === CHAIN_ID_XPLA
    ? "XPLA"
    : chainId === CHAIN_ID_APTOS
    ? "APTOS"
    : chainId === CHAIN_ID_ARBITRUM
    ? "ETH"
    : chainId === CHAIN_ID_MOONBEAM
    ? "GLMR"
    : chainId === CHAIN_ID_BASE
    ? "ETH"
    : chainId === CHAIN_ID_OPTIMISM
    ? "ETH"
    : chainId === CHAIN_ID_SUI
    ? "SUI"
    : "";

export const getDefaultNativeCurrencyAddressEvm = (chainId: ChainId) => {
  return chainId === CHAIN_ID_ETH
    ? WETH_ADDRESS
    : chainId === CHAIN_ID_SEPOLIA
    ? WETH_ADDRESS_SEPOLIA
    : chainId === CHAIN_ID_BSC
    ? WBNB_ADDRESS
    : chainId === CHAIN_ID_POLYGON
    ? WMATIC_ADDRESS
    : chainId === CHAIN_ID_AVAX
    ? WAVAX_ADDRESS
    : chainId === CHAIN_ID_OASIS
    ? WROSE_ADDRESS
    : chainId === CHAIN_ID_AURORA
    ? WETH_AURORA_ADDRESS
    : chainId === CHAIN_ID_FANTOM
    ? WFTM_ADDRESS
    : chainId === CHAIN_ID_KARURA
    ? KAR_ADDRESS
    : chainId === CHAIN_ID_ACALA
    ? ACA_ADDRESS
    : chainId === CHAIN_ID_KLAYTN
    ? WKLAY_ADDRESS
    : chainId === CHAIN_ID_CELO
    ? CELO_ADDRESS
    : chainId === CHAIN_ID_NEON
    ? WNEON_ADDRESS
    : chainId === CHAIN_ID_MOONBEAM
    ? WGLMR_ADDRESS
    : "";
};

export const getExplorerName = (chainId: ChainId) =>
  chainId === CHAIN_ID_ETH || chainId === CHAIN_ID_SEPOLIA
    ? "Etherscan"
    : chainId === CHAIN_ID_BSC
    ? "BscScan"
    : isTerraChain(chainId)
    ? "Finder"
    : chainId === CHAIN_ID_POLYGON
    ? "Polygonscan"
    : chainId === CHAIN_ID_AVAX
    ? "Snowtrace"
    : chainId === CHAIN_ID_ALGORAND
    ? "AlgoExplorer"
    : chainId === CHAIN_ID_FANTOM
    ? "FTMScan"
    : chainId === CHAIN_ID_KLAYTN
    ? "Klaytnscope"
    : chainId === CHAIN_ID_SOLANA
    ? "Solscan"
    : chainId === CHAIN_ID_XPLA
    ? "XPLA Explorer"
    : chainId === CHAIN_ID_ARBITRUM
    ? "Arbiscan"
    : chainId === CHAIN_ID_MOONBEAM
    ? "Moonscan"
    : chainId === CHAIN_ID_BASE
    ? "BaseScan"
    : "Explorer";
export const WORMHOLE_RPC_HOSTS =
  CLUSTER === "testnet"
    ? ["https://wormhole-v2-testnet-api.certus.one"]
    : ["http://localhost:7071"];
export const ETH_NETWORK_CHAIN_ID = CLUSTER === "testnet" ? 5 : 1337;
export const SEPOLIA_NETWORK_CHAIN_ID = CLUSTER === "testnet" ? 11155111 : 1337;
export const BSC_NETWORK_CHAIN_ID = CLUSTER === "testnet" ? 97 : 1397;
export const POLYGON_NETWORK_CHAIN_ID = CLUSTER === "testnet" ? 80001 : 1381;
export const AVAX_NETWORK_CHAIN_ID = CLUSTER === "testnet" ? 43113 : 1381;
export const OASIS_NETWORK_CHAIN_ID = CLUSTER === "testnet" ? 42261 : 1381;
export const AURORA_NETWORK_CHAIN_ID =
  CLUSTER === "testnet" ? 1313161555 : 1381;
export const FANTOM_NETWORK_CHAIN_ID = CLUSTER === "testnet" ? 4002 : 1381;
export const KARURA_NETWORK_CHAIN_ID = CLUSTER === "testnet" ? 596 : 1381;
export const ACALA_NETWORK_CHAIN_ID = CLUSTER === "testnet" ? 597 : 1381;
export const KLAYTN_NETWORK_CHAIN_ID = CLUSTER === "testnet" ? 1001 : 1381;
export const CELO_NETWORK_CHAIN_ID = CLUSTER === "testnet" ? 44787 : 1381;
export const NEON_NETWORK_CHAIN_ID = CLUSTER === "testnet" ? 245022926 : 1381;
export const ARBITRUM_NETWORK_CHAIN_ID = CLUSTER === "testnet" ? 421613 : 1381;
export const MOONBEAM_NETWORK_CHAIN_ID = CLUSTER === "testnet" ? 1287 : 1381;
export const BASE_NETWORK_CHAIN_ID = CLUSTER === "testnet" ? 84531 : 1381;
export const OPTIMISM_NETWORK_CHAIN_ID = CLUSTER === "testnet" ? 420 : 1381;
export const getEvmChainId = (chainId: ChainId) =>
  chainId === CHAIN_ID_ETH
    ? ETH_NETWORK_CHAIN_ID
    : chainId === CHAIN_ID_SEPOLIA
    ? SEPOLIA_NETWORK_CHAIN_ID
    : chainId === CHAIN_ID_BSC
    ? BSC_NETWORK_CHAIN_ID
    : chainId === CHAIN_ID_POLYGON
    ? POLYGON_NETWORK_CHAIN_ID
    : chainId === CHAIN_ID_AVAX
    ? AVAX_NETWORK_CHAIN_ID
    : chainId === CHAIN_ID_OASIS
    ? OASIS_NETWORK_CHAIN_ID
    : chainId === CHAIN_ID_AURORA
    ? AURORA_NETWORK_CHAIN_ID
    : chainId === CHAIN_ID_FANTOM
    ? FANTOM_NETWORK_CHAIN_ID
    : chainId === CHAIN_ID_KARURA
    ? KARURA_NETWORK_CHAIN_ID
    : chainId === CHAIN_ID_ACALA
    ? ACALA_NETWORK_CHAIN_ID
    : chainId === CHAIN_ID_KLAYTN
    ? KLAYTN_NETWORK_CHAIN_ID
    : chainId === CHAIN_ID_CELO
    ? CELO_NETWORK_CHAIN_ID
    : chainId === CHAIN_ID_NEON
    ? NEON_NETWORK_CHAIN_ID
    : chainId === CHAIN_ID_ARBITRUM
    ? ARBITRUM_NETWORK_CHAIN_ID
    : chainId === CHAIN_ID_MOONBEAM
    ? MOONBEAM_NETWORK_CHAIN_ID
    : chainId === CHAIN_ID_BASE
    ? BASE_NETWORK_CHAIN_ID
    : chainId === CHAIN_ID_OPTIMISM
    ? OPTIMISM_NETWORK_CHAIN_ID
    : undefined;
export const SOLANA_HOST = process.env.REACT_APP_SOLANA_API_URL
  ? process.env.REACT_APP_SOLANA_API_URL
  : CLUSTER === "testnet"
  ? clusterApiUrl("devnet")
  : "http://localhost:8899";

export const getTerraConfig = (chainId: TerraChainId) => {
  const isClassic = chainId === CHAIN_ID_TERRA;
  return CLUSTER === "testnet"
    ? {
        URL:
          chainId === CHAIN_ID_TERRA2
            ? "https://pisco-lcd.terra.dev"
            : "https://bombay-lcd.terra.dev",
        chainID: chainId === CHAIN_ID_TERRA2 ? "pisco-1" : "bombay-12",
        name: "testnet",
        isClassic,
      }
    : {
        URL:
          chainId === CHAIN_ID_TERRA2
            ? "http://localhost:1318"
            : "http://localhost:1317",
        chainID: chainId === CHAIN_ID_TERRA2 ? "phoenix-1" : "columbus-5",
        name: "localterra",
        isClassic,
      };
};

export const XPLA_LCD_CLIENT_CONFIG = {
  URL: "https://cube-lcd.xpla.dev",
  chainID: "cube_47-5",
};

export const XPLA_GAS_PRICES_URL =
  "https://cube-fcd.xpla.dev/v1/txs/gas_prices";

export const APTOS_URL =
  CLUSTER === "testnet"
    ? "https://testnet.aptoslabs.com"
    : "http://localhost:8080";

export const APTOS_NETWORK =
  CLUSTER === "testnet" ? AptosNetwork.Testnet : AptosNetwork.Localhost;

export const APTOS_NATIVE_DECIMALS = 8;
export const APTOS_NATIVE_TOKEN_KEY = "0x1::aptos_coin::AptosCoin";

export const INJECTIVE_NETWORK = Network.TestnetK8s;
export const INJECTIVE_NETWORK_INFO = getNetworkInfo(Network.TestnetK8s);

export const SEI_CHAIN_CONFIGURATION: ChainConfiguration = {
  chainId: "atlantic-2",
  restUrl: "https://sei-testnet-api.polkachu.com",
  rpcUrl: "https://sei-testnet-rpc.polkachu.com",
};

export const SEI_TRANSLATOR =
  "sei1dkdwdvknx0qav5cp5kw68mkn3r99m3svkyjfvkztwh97dv2lm0ksj6xrak";
export const SEI_TRANSLATER_TARGET = cosmos.canonicalAddress(SEI_TRANSLATOR);
export const SEI_DECIMALS = 6;

export const SUI_CONNECTION =
  CLUSTER === "testnet" ? testnetConnection : localnetConnection;

export const SUI_NATIVE_DECIMALS = 9;
export const SUI_NATIVE_TOKEN_KEY = "0x2::sui::SUI";

export const ALGORAND_HOST =
  CLUSTER === "testnet"
    ? {
        algodToken: "",
        algodServer: "https://testnet-api.algonode.cloud",
        algodPort: "",
      }
    : {
        algodToken:
          "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        algodServer: "http://localhost",
        algodPort: "4001",
      };
export const KARURA_HOST =
  CLUSTER === "testnet" ? "https://karura-dev.aca-dev.network/eth/http" : "";
export const ACALA_HOST =
  CLUSTER === "testnet" ? "https://acala-dev.aca-dev.network/eth/http" : "";

export const SOL_CUSTODY_ADDRESS =
  "GugU1tP7doLeTw9hQP51xRJyS8Da1fWxuiy2rVrnMD2m";
export const SOL_NFT_CUSTODY_ADDRESS =
  "D63bhHo634eXSj4Jq3xgu2fjB5XKc8DFHzDY9iZk7fv1";
export const TERRA_TEST_TOKEN_ADDRESS =
  "terra13nkgqrfymug724h8pprpexqj9h629sa3ncw7sh";

export const ALGORAND_WAIT_FOR_CONFIRMATIONS = CLUSTER === "testnet" ? 4 : 1;

export const SOL_BRIDGE_ADDRESS =
  CONTRACTS[CLUSTER === "testnet" ? "TESTNET" : "DEVNET"].solana.core;

export const SOL_NFT_BRIDGE_ADDRESS =
  CONTRACTS[CLUSTER === "testnet" ? "TESTNET" : "DEVNET"].solana.nft_bridge;
export const SOL_TOKEN_BRIDGE_ADDRESS =
  CONTRACTS[CLUSTER === "testnet" ? "TESTNET" : "DEVNET"].solana.token_bridge;

export const ALGORAND_BRIDGE_ID = BigInt(
  CONTRACTS[CLUSTER === "testnet" ? "TESTNET" : "DEVNET"].algorand.core
);
export const ALGORAND_TOKEN_BRIDGE_ID = BigInt(
  CONTRACTS[CLUSTER === "testnet" ? "TESTNET" : "DEVNET"].algorand.token_bridge
);

export const NEAR_CORE_BRIDGE_ACCOUNT =
  CLUSTER === "testnet" ? "wormhole.wormhole.testnet" : "wormhole.test.near";

export const NEAR_TOKEN_BRIDGE_ACCOUNT =
  CLUSTER === "testnet" ? "token.wormhole.testnet" : "token.test.near";

export const getBridgeAddressForChain = (chainId: ChainId) =>
  CONTRACTS[CLUSTER === "testnet" ? "TESTNET" : "DEVNET"][
    coalesceChainName(chainId)
  ].core || "";
export const getNFTBridgeAddressForChain = (chainId: ChainId) =>
  CONTRACTS[CLUSTER === "testnet" ? "TESTNET" : "DEVNET"][
    coalesceChainName(chainId)
  ].nft_bridge || "";
export const getTokenBridgeAddressForChain = (chainId: ChainId) =>
  CONTRACTS[CLUSTER === "testnet" ? "TESTNET" : "DEVNET"][
    coalesceChainName(chainId)
  ].token_bridge || "";

export const COVALENT_API_KEY = process.env.REACT_APP_COVALENT_API_KEY
  ? process.env.REACT_APP_COVALENT_API_KEY
  : "";

export const COVALENT_ETHEREUM = 5; // Covalent only supports mainnet and Goerli
export const COVALENT_BSC = CLUSTER === "devnet" ? 56 : BSC_NETWORK_CHAIN_ID;
export const COVALENT_POLYGON =
  CLUSTER === "devnet" ? 137 : POLYGON_NETWORK_CHAIN_ID;
export const COVALENT_AVAX = CLUSTER === "devnet" ? 137 : AVAX_NETWORK_CHAIN_ID;
export const COVALENT_FANTOM =
  CLUSTER === "devnet" ? 250 : FANTOM_NETWORK_CHAIN_ID;
export const COVALENT_KLAYTN = null; // Covalent only support mainnet
export const COVALENT_CELO = CLUSTER === "devnet" ? null : null;
export const COVALENT_NEON = CLUSTER === "devnet" ? null : null;
export const COVALENT_ARBITRUM =
  CLUSTER === "devnet" ? null : ARBITRUM_NETWORK_CHAIN_ID;

export const COVALENT_MOONBEAM =
  CLUSTER === "devnet" ? null : MOONBEAM_NETWORK_CHAIN_ID; // Covalent only supports mainnet
export const COVALENT_BASE =
  CLUSTER === "devnet" ? null : BASE_NETWORK_CHAIN_ID;
export const COVALENT_OPTIMISM =
  CLUSTER === "devnet" ? null : OPTIMISM_NETWORK_CHAIN_ID;

export const COVALENT_GET_TOKENS_URL = (
  chainId: ChainId,
  walletAddress: string,
  nft?: boolean,
  noNftMetadata?: boolean
) => {
  const chainNum =
    chainId === CHAIN_ID_ETH
      ? COVALENT_ETHEREUM
      : chainId === CHAIN_ID_BSC
      ? COVALENT_BSC
      : chainId === CHAIN_ID_POLYGON
      ? COVALENT_POLYGON
      : chainId === CHAIN_ID_AVAX
      ? COVALENT_AVAX
      : chainId === CHAIN_ID_FANTOM
      ? COVALENT_FANTOM
      : chainId === CHAIN_ID_KLAYTN
      ? COVALENT_KLAYTN
      : chainId === CHAIN_ID_CELO
      ? COVALENT_CELO
      : chainId === CHAIN_ID_NEON
      ? COVALENT_NEON
      : chainId === CHAIN_ID_ARBITRUM
      ? COVALENT_ARBITRUM
      : chainId === CHAIN_ID_MOONBEAM
      ? COVALENT_MOONBEAM
      : chainId === CHAIN_ID_BASE
      ? COVALENT_BASE
      : chainId === CHAIN_ID_OPTIMISM
      ? COVALENT_OPTIMISM
      : "";
  // https://www.covalenthq.com/docs/api/#get-/v1/{chain_id}/address/{address}/balances_v2/
  return chainNum
    ? `https://api.covalenthq.com/v1/${chainNum}/address/${walletAddress}/balances_v2/?key=${COVALENT_API_KEY}${
        nft ? "&nft=true" : ""
      }${noNftMetadata ? "&no-nft-fetch=true" : ""}`
    : "";
};

export const BLOCKSCOUT_GET_TOKENS_URL = (
  chainId: ChainId,
  walletAddress: string
) => {
  const baseUrl =
    chainId === CHAIN_ID_OASIS
      ? CLUSTER === "testnet"
        ? "https://testnet.explorer.emerald.oasis.dev"
        : ""
      : chainId === CHAIN_ID_AURORA
      ? CLUSTER === "testnet"
        ? "https://explorer.testnet.aurora.dev"
        : ""
      : chainId === CHAIN_ID_ACALA
      ? CLUSTER === "testnet"
        ? "https://blockscout.acala-dev.aca-dev.network"
        : ""
      : chainId === CHAIN_ID_KARURA
      ? CLUSTER === "testnet"
        ? "https://blockscout.karura-dev.aca-dev.network"
        : ""
      : chainId === CHAIN_ID_CELO
      ? CLUSTER === "testnet"
        ? "https://alfajores-blockscout.celo-testnet.org"
        : ""
      : "";
  return baseUrl
    ? `${baseUrl}/api?module=account&action=tokenlist&address=${walletAddress}`
    : "";
};

export const TERRA_SWAPRATE_URL =
  "https://fcd.terra.dev/v1/market/swaprate/uusd";

export const WETH_ADDRESS =
  CLUSTER === "testnet"
    ? "0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6"
    : "0xDDb64fE46a91D46ee29420539FC25FD07c5FEa3E";
export const WETH_DECIMALS = 18;

export const WETH_ADDRESS_SEPOLIA =
  CLUSTER === "testnet"
    ? "0xeef12A83EE5b7161D3873317c8E0E7B76e0B5D9c"
    : "0xDDb64fE46a91D46ee29420539FC25FD07c5FEa3E";
export const WETH_DECIMALS_SEPOLIA = 18;

export const WBNB_ADDRESS =
  CLUSTER === "testnet"
    ? "0xae13d989dac2f0debff460ac112a837c89baa7cd"
    : "0xDDb64fE46a91D46ee29420539FC25FD07c5FEa3E";
export const WBNB_DECIMALS = 18;

export const WMATIC_ADDRESS =
  CLUSTER === "testnet"
    ? "0x9c3c9283d3e44854697cd22d3faa240cfb032889"
    : "0xDDb64fE46a91D46ee29420539FC25FD07c5FEa3E";
export const WMATIC_DECIMALS = 18;

export const WAVAX_ADDRESS =
  CLUSTER === "testnet"
    ? "0xd00ae08403b9bbb9124bb305c09058e32c39a48c"
    : "0xDDb64fE46a91D46ee29420539FC25FD07c5FEa3E";
export const WAVAX_DECIMALS = 18;

export const WROSE_ADDRESS =
  CLUSTER === "testnet"
    ? "0x792296e2a15e6Ceb5f5039DecaE7A1f25b00B0B0"
    : "0xDDb64fE46a91D46ee29420539FC25FD07c5FEa3E";
export const WROSE_DECIMALS = 18;

export const WETH_AURORA_ADDRESS =
  CLUSTER === "testnet"
    ? "0x9D29f395524B3C817ed86e2987A14c1897aFF849"
    : "0xDDb64fE46a91D46ee29420539FC25FD07c5FEa3E";
export const WETH_AURORA_DECIMALS = 18;

export const WFTM_ADDRESS =
  CLUSTER === "testnet"
    ? "0xf1277d1Ed8AD466beddF92ef448A132661956621"
    : "0xDDb64fE46a91D46ee29420539FC25FD07c5FEa3E";
export const WFTM_DECIMALS = 18;

export const KAR_ADDRESS =
  CLUSTER === "testnet"
    ? "0x0000000000000000000100000000000000000080"
    : "0xDDb64fE46a91D46ee29420539FC25FD07c5FEa3E";
export const KAR_DECIMALS = 12;

export const ACA_ADDRESS =
  CLUSTER === "testnet"
    ? "0x0000000000000000000100000000000000000000"
    : "0xDDb64fE46a91D46ee29420539FC25FD07c5FEa3E";
export const ACA_DECIMALS = 12;

export const WKLAY_ADDRESS =
  CLUSTER === "testnet"
    ? "0x0339d5eb6d195ba90b13ed1bceaa97ebd198b106"
    : "0xDDb64fE46a91D46ee29420539FC25FD07c5FEa3E";
export const WKLAY_DECIMALS = 18;

export const CELO_ADDRESS =
  CLUSTER === "testnet"
    ? "0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9"
    : "0xDDb64fE46a91D46ee29420539FC25FD07c5FEa3E";
export const CELO_DECIMALS = 18;

export const WNEON_ADDRESS =
  CLUSTER === "testnet"
    ? "0x11adc2d986e334137b9ad0a0f290771f31e9517f"
    : "0xDDb64fE46a91D46ee29420539FC25FD07c5FEa3E";
export const WNEON_DECIMALS = 18;

export const WGLMR_ADDRESS =
  CLUSTER === "testnet"
    ? "0xD909178CC99d318e4D46e7E66a972955859670E1"
    : "0xDDb64fE46a91D46ee29420539FC25FD07c5FEa3E";
export const WGLMR_DECIMALS = 18;

export const ALGO_DECIMALS = 6;

export const TERRA_TOKEN_METADATA_URL =
  "https://assets.terra.money/cw20/tokens.json";

// hardcoded addresses for warnings
export const SOLANA_TOKENS_THAT_EXIST_ELSEWHERE = [
  "SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt", //  SRM
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
  "kinXdEcpDQeHPEuQnqmUgtYykqKGVFq6CeVX5iAHJq6", //  KIN
  "CDJWUqTcYTVAKXAVXoQZFes5JUFc7owSeq7eMQcDSbo5", // renBTC
  "8wv2KAykQstNAj2oW6AHANGBiFKVFhvMiyyzzjhkmGvE", // renLUNA
  "G1a6jxYz3m8DVyMqYnuV7s86wD4fvuXYneWSpLJkmsXj", // renBCH
  "FKJvvVJ242tX7zFtzTmzqoA631LqHh4CdgcN8dcfFSju", // renDGB
  "ArUkYE2XDKzqy77PRRGjo4wREWwqk6RXTfM9NeqzPvjU", // renDOGE
  "E99CQ2gFMmbiyK2bwiaFNWUUmwz4r8k2CVEFxwuvQ7ue", // renZEC
  "De2bU64vsXKU9jq4bCjeDxNRGPn8nr3euaTK8jBYmD3J", // renFIL
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", // USDT
];
export const ETH_TOKENS_THAT_EXIST_ELSEWHERE = [
  getAddress("0x476c5E26a75bd202a9683ffD34359C0CC15be0fF"), // SRM
  getAddress("0x818fc6c2ec5986bc6e2cbf00939d90556ab12ce5"), // KIN
  getAddress("0xeb4c2781e4eba804ce9a9803c67d0893436bb27d"), // renBTC
  getAddress("0x52d87F22192131636F93c5AB18d0127Ea52CB641"), // renLUNA
  getAddress("0x459086f2376525bdceba5bdda135e4e9d3fef5bf"), // renBCH
  getAddress("0xe3cb486f3f5c639e98ccbaf57d95369375687f80"), // renDGB
  getAddress("0x3832d2F059E55934220881F831bE501D180671A7"), // renDOGE
  getAddress("0x1c5db575e2ff833e46a2e9864c22f4b22e0b37c2"), // renZEC
  getAddress("0xD5147bc8e386d91Cc5DBE72099DAC6C9b99276F5"), // renFIL
];
export const ETH_TOKENS_THAT_CAN_BE_SWAPPED_ON_SOLANA = [
  getAddress("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"), // USDC
  getAddress("0xdac17f958d2ee523a2206206994597c13d831ec7"), // USDT
];
export const BSC_MARKET_WARNINGS = [
  getAddress(WBNB_ADDRESS),
  getAddress("0xe9e7cea3dedca5984780bafc599bd69add087d56"), // BUSD
  getAddress("0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d"), // USDC
  getAddress("0x55d398326f99059ff775485246999027b3197955"), // BSC-USD
];

export const MIGRATION_PROGRAM_ADDRESS =
  CLUSTER === "testnet" ? "" : "Ex9bCdVMSfx7EzB3pgSi2R4UHwJAXvTw18rBQm5YQ8gK";

export const SUPPORTED_TERRA_TOKENS = ["uluna", "uusd"];
export const TERRA_DEFAULT_FEE_DENOM = SUPPORTED_TERRA_TOKENS[0];

export const XPLA_NATIVE_DENOM = "axpla";

export const getTerraFCDBaseUrl = (chainId: TerraChainId) =>
  CLUSTER === "testnet"
    ? chainId === CHAIN_ID_TERRA2
      ? "https://pisco-fcd.terra.dev"
      : "https://bombay-fcd.terra.dev"
    : chainId === CHAIN_ID_TERRA2
    ? "http://localhost:3061"
    : "http://localhost:3060";

export const getTerraGasPricesUrl = (chainId: TerraChainId) =>
  `${getTerraFCDBaseUrl(chainId)}/v1/txs/gas_prices`;

export const nearKeyStore = new keyStores.BrowserLocalStorageKeyStore();

export const getNearConnectionConfig = (): ConnectConfig =>
  CLUSTER === "testnet"
    ? {
        networkId: "testnet",
        keyStore: nearKeyStore,
        nodeUrl: "https://rpc.testnet.near.org",
        walletUrl: "https://wallet.testnet.near.org",
        helperUrl: "https://helper.testnet.near.org",
        headers: {},
      }
    : {
        networkId: "sandbox",
        keyStore: nearKeyStore,
        nodeUrl: "http://localhost:3030",
        helperUrl: "",
        headers: {},
      };

export const NATIVE_NEAR_DECIMALS = 24;
export const NATIVE_NEAR_PLACEHOLDER = "near";
export const NATIVE_NEAR_WH_ADDRESS =
  "0000000000000000000000000000000000000000000000000000000000000000";

export const WORMHOLE_EXPLORER_BASE = "https://wormhole.com/explorer";

export const SOLANA_SYSTEM_PROGRAM_ADDRESS = "11111111111111111111111111111111";

export const getHowToAddTokensToWalletUrl = (chainId: ChainId) => {
  if (isEVMChain(chainId)) {
    return "https://docs.wormhole.com/wormhole/video-tutorial-how-to-manually-add-tokens-to-your-wallet#metamask";
  } else if (isTerraChain(chainId)) {
    return "https://docs.wormhole.com/wormhole/video-tutorial-how-to-manually-add-tokens-to-your-wallet#terra-station";
  }
  return "";
};

export const getHowToAddToTokenListUrl = (chainId: ChainId) => {
  if (chainId === CHAIN_ID_SOLANA) {
    return "https://github.com/solana-labs/token-list";
  } else if (isTerraChain(chainId)) {
    return "https://github.com/terra-money/assets";
  }
  return "";
};

export const SOLANA_TOKEN_METADATA_PROGRAM_URL =
  "https://github.com/metaplex-foundation/metaplex-program-library/tree/master/token-metadata/program";
export const MAX_VAA_UPLOAD_RETRIES_SOLANA = 5;

export const POLYGON_TERRA_WRAPPED_TOKENS = [
  "0x692597b009d13c4049a947cab2239b7d6517875f", // Wrapped UST Token
  "0x24834bbec7e39ef42f4a75eaf8e5b6486d3f0e57", // Wrapped LUNA Token
];

export const getIsTransferDisabled = (
  chainId: ChainId,
  isSourceChain: boolean
) => {
  const disableTransfers = CHAIN_CONFIG_MAP[chainId]?.disableTransfers;
  return disableTransfers === "from"
    ? isSourceChain
    : disableTransfers === "to"
    ? !isSourceChain
    : !!disableTransfers;
};

export const LUNA_ADDRESS = "uluna";
export const UST_ADDRESS = "uusd";

export type RelayerCompareAsset = {
  [key in ChainId]: string;
};
export const RELAYER_COMPARE_ASSET: RelayerCompareAsset = {
  [CHAIN_ID_SOLANA]: "solana",
  [CHAIN_ID_ETH]: "ethereum",
  [CHAIN_ID_TERRA]: "terra-luna",
  [CHAIN_ID_BSC]: "binancecoin",
  [CHAIN_ID_POLYGON]: "matic-network",
  [CHAIN_ID_AVAX]: "avalanche-2",
  [CHAIN_ID_OASIS]: "oasis-network",
  [CHAIN_ID_FANTOM]: "fantom",
  [CHAIN_ID_AURORA]: "ethereum", // Aurora uses bridged ether
  [CHAIN_ID_KLAYTN]: "klay-token",
  [CHAIN_ID_CELO]: "celo",
} as RelayerCompareAsset;
export const getCoinGeckoURL = (coinGeckoId: string) =>
  `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoId}&vs_currencies=usd`;

export const RELAYER_INFO_URL =
  CLUSTER === "testnet" ? "" : "/relayerExample.json";

export const RELAY_URL_EXTENSION = "/relayvaa/";

// also for karura
export const ACALA_RELAYER_URL =
  CLUSTER === "testnet" ? "https://wormhole-relayer.aca-staging.network" : "";

export const ACALA_RELAY_URL = `${ACALA_RELAYER_URL}/relay`;
export const ACALA_SHOULD_RELAY_URL = `${ACALA_RELAYER_URL}/shouldRelay`;

export const getChainShortName = (chainId: ChainId) => {
  return chainId === CHAIN_ID_BSC ? "BSC" : CHAINS_BY_ID[chainId]?.name;
};

export const DISABLED_TOKEN_TRANSFERS: {
  [key in ChainId]?: { [address: string]: ChainId[] };
} = {
  [CHAIN_ID_ACALA]: {
    "0x0000000000000000000100000000000000000001": [CHAIN_ID_KARURA], // aUSD
  },
  [CHAIN_ID_KARURA]: {
    "0x0000000000000000000100000000000000000081": [], // aUSD
  },
};
export const getIsTokenTransferDisabled = (
  sourceChain: ChainId,
  targetChain: ChainId,
  tokenAddress: string
): boolean => {
  const disabledTransfers =
    DISABLED_TOKEN_TRANSFERS[sourceChain]?.[tokenAddress];
  return disabledTransfers !== undefined
    ? disabledTransfers.length === 0 || disabledTransfers.includes(targetChain)
    : false;
};

export const USD_NUMBER_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
