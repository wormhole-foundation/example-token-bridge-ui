import {
  ChainId,
  CHAIN_ID_ACALA,
  CHAIN_ID_ALGORAND,
  CHAIN_ID_AURORA,
  CHAIN_ID_AVAX,
  CHAIN_ID_BSC,
  CHAIN_ID_CELO,
  CHAIN_ID_ETH,
  CHAIN_ID_ETHEREUM_ROPSTEN,
  CHAIN_ID_FANTOM,
  CHAIN_ID_KARURA,
  CHAIN_ID_KLAYTN,
  CHAIN_ID_NEON,
  CHAIN_ID_OASIS,
  CHAIN_ID_POLYGON,
  CHAIN_ID_SOLANA,
  CHAIN_ID_TERRA,
  CHAIN_ID_TERRA2,
  CONTRACTS,
  isEVMChain,
  isTerraChain,
  TerraChainId,
} from "@certusone/wormhole-sdk";
import { clusterApiUrl } from "@solana/web3.js";
import { getAddress } from "ethers/lib/utils";
import { CHAIN_CONFIG_MAP } from "../config";
import acalaIcon from "../icons/acala.svg";
import algorandIcon from "../icons/algorand.svg";
import auroraIcon from "../icons/aurora.svg";
import avaxIcon from "../icons/avax.svg";
import bscIcon from "../icons/bsc.svg";
import celoIcon from "../icons/celo.svg";
import ethIcon from "../icons/eth.svg";
import fantomIcon from "../icons/fantom.svg";
import karuraIcon from "../icons/karura.svg";
import klaytnIcon from "../icons/klaytn.svg";
import neonIcon from "../icons/neon.svg";
import oasisIcon from "../icons/oasis-network-rose-logo.svg";
import polygonIcon from "../icons/polygon.svg";
import solanaIcon from "../icons/solana.svg";
import terraIcon from "../icons/terra.svg";
import terra2Icon from "../icons/terra2.svg";

export type Cluster = "devnet" | "testnet";
export const CLUSTER: Cluster =
  process.env.REACT_APP_CLUSTER === "testnet" ? "testnet" : "devnet";
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
          id: CHAIN_ID_ETHEREUM_ROPSTEN,
          name: "Ethereum (Ropsten)",
          logo: ethIcon,
        },
        {
          id: CHAIN_ID_FANTOM,
          name: "Fantom",
          logo: fantomIcon,
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
          id: CHAIN_ID_POLYGON,
          name: "Polygon",
          logo: polygonIcon,
        },
        {
          id: CHAIN_ID_SOLANA,
          name: "Solana",
          logo: solanaIcon,
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
      ]
    : [
        {
          id: CHAIN_ID_ALGORAND,
          name: "Algorand",
          logo: algorandIcon,
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
          id: CHAIN_ID_SOLANA,
          name: "Solana",
          logo: solanaIcon,
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
    id === CHAIN_ID_ETHEREUM_ROPSTEN ||
    id === CHAIN_ID_POLYGON ||
    id === CHAIN_ID_OASIS ||
    id === CHAIN_ID_SOLANA ||
    id === CHAIN_ID_AURORA ||
    id === CHAIN_ID_FANTOM ||
    id === CHAIN_ID_KARURA ||
    id === CHAIN_ID_ACALA ||
    id === CHAIN_ID_KLAYTN ||
    id === CHAIN_ID_CELO ||
    id === CHAIN_ID_NEON
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
    : chainId === CHAIN_ID_ETH || chainId === CHAIN_ID_ETHEREUM_ROPSTEN
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
    : "";

export const getDefaultNativeCurrencyAddressEvm = (chainId: ChainId) => {
  return chainId === CHAIN_ID_ETH
    ? WETH_ADDRESS
    : chainId === CHAIN_ID_BSC
    ? WBNB_ADDRESS
    : chainId === CHAIN_ID_POLYGON
    ? WMATIC_ADDRESS
    : chainId === CHAIN_ID_ETHEREUM_ROPSTEN
    ? ROPSTEN_WETH_ADDRESS
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
    : "";
};

export const getExplorerName = (chainId: ChainId) =>
  chainId === CHAIN_ID_ETH || chainId === CHAIN_ID_ETHEREUM_ROPSTEN
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
    : "Explorer";
export const WORMHOLE_RPC_HOSTS =
  CLUSTER === "testnet"
    ? ["https://wormhole-v2-testnet-api.certus.one"]
    : ["http://localhost:7071"];
export const ETH_NETWORK_CHAIN_ID = CLUSTER === "testnet" ? 5 : 1337;
export const ROPSTEN_ETH_NETWORK_CHAIN_ID = CLUSTER === "testnet" ? 3 : 1337;
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
export const getEvmChainId = (chainId: ChainId) =>
  chainId === CHAIN_ID_ETH
    ? ETH_NETWORK_CHAIN_ID
    : chainId === CHAIN_ID_ETHEREUM_ROPSTEN
    ? ROPSTEN_ETH_NETWORK_CHAIN_ID
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
export const ETH_BRIDGE_ADDRESS = getAddress(
  CLUSTER === "testnet"
    ? "0x706abc4E45D419950511e474C7B9Ed348A4a716c"
    : "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550"
);
export const ETH_NFT_BRIDGE_ADDRESS = getAddress(
  CLUSTER === "testnet"
    ? "0xD8E4C2DbDd2e2bd8F1336EA691dBFF6952B1a6eB"
    : "0x26b4afb60d6c903165150c6f0aa14f8016be4aec"
);
export const ETH_TOKEN_BRIDGE_ADDRESS = getAddress(
  CLUSTER === "testnet"
    ? "0xF890982f9310df57d00f659cf4fd87e65adEd8d7"
    : "0x0290FB167208Af455bB137780163b7B7a9a10C16"
);
export const BSC_BRIDGE_ADDRESS = getAddress(
  CLUSTER === "testnet"
    ? "0x68605AD7b15c732a30b1BbC62BE8F2A509D74b4D"
    : "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550"
);
export const BSC_NFT_BRIDGE_ADDRESS = getAddress(
  CLUSTER === "testnet"
    ? "0xcD16E5613EF35599dc82B24Cb45B5A93D779f1EE"
    : "0x26b4afb60d6c903165150c6f0aa14f8016be4aec"
);
export const BSC_TOKEN_BRIDGE_ADDRESS = getAddress(
  CLUSTER === "testnet"
    ? "0x9dcF9D205C9De35334D646BeE44b2D2859712A09"
    : "0x0290FB167208Af455bB137780163b7B7a9a10C16"
);
export const POLYGON_BRIDGE_ADDRESS = getAddress(
  CLUSTER === "testnet"
    ? "0x0CBE91CF822c73C2315FB05100C2F714765d5c20"
    : "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550"
);
export const POLYGON_NFT_BRIDGE_ADDRESS = getAddress(
  CLUSTER === "testnet"
    ? "0x51a02d0dcb5e52F5b92bdAA38FA013C91c7309A9"
    : "0x26b4afb60d6c903165150c6f0aa14f8016be4aec"
);
export const POLYGON_TOKEN_BRIDGE_ADDRESS = getAddress(
  CLUSTER === "testnet"
    ? "0x377D55a7928c046E18eEbb61977e714d2a76472a"
    : "0x0290FB167208Af455bB137780163b7B7a9a10C16"
);
export const AVAX_BRIDGE_ADDRESS = getAddress(
  CLUSTER === "testnet"
    ? "0x7bbcE28e64B3F8b84d876Ab298393c38ad7aac4C"
    : "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550"
);
export const AVAX_NFT_BRIDGE_ADDRESS = getAddress(
  CLUSTER === "testnet"
    ? "0xD601BAf2EEE3C028344471684F6b27E789D9075D"
    : "0x26b4afb60d6c903165150c6f0aa14f8016be4aec"
);
export const AVAX_TOKEN_BRIDGE_ADDRESS = getAddress(
  CLUSTER === "testnet"
    ? "0x61E44E506Ca5659E6c0bba9b678586fA2d729756"
    : "0x0290FB167208Af455bB137780163b7B7a9a10C16"
);
export const OASIS_BRIDGE_ADDRESS = getAddress(
  CLUSTER === "testnet"
    ? "0xc1C338397ffA53a2Eb12A7038b4eeb34791F8aCb"
    : "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550"
);
export const OASIS_NFT_BRIDGE_ADDRESS = getAddress(
  CLUSTER === "testnet"
    ? "0xC5c25B41AB0b797571620F5204Afa116A44c0ebA"
    : "0x26b4afb60d6c903165150c6f0aa14f8016be4aec"
);
export const OASIS_TOKEN_BRIDGE_ADDRESS = getAddress(
  CLUSTER === "testnet"
    ? "0x88d8004A9BdbfD9D28090A02010C19897a29605c"
    : "0x0290FB167208Af455bB137780163b7B7a9a10C16"
);
export const AURORA_BRIDGE_ADDRESS = getAddress(
  CLUSTER === "testnet"
    ? "0xBd07292de7b505a4E803CEe286184f7Acf908F5e"
    : "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550"
);
export const AURORA_NFT_BRIDGE_ADDRESS = getAddress(
  CLUSTER === "testnet"
    ? "0x8F399607E9BA2405D87F5f3e1B78D950b44b2e24"
    : "0x26b4afb60d6c903165150c6f0aa14f8016be4aec"
);
export const AURORA_TOKEN_BRIDGE_ADDRESS = getAddress(
  CLUSTER === "testnet"
    ? "0xD05eD3ad637b890D68a854d607eEAF11aF456fba"
    : "0x0290FB167208Af455bB137780163b7B7a9a10C16"
);
export const FANTOM_BRIDGE_ADDRESS = getAddress(
  CLUSTER === "testnet"
    ? "0x1BB3B4119b7BA9dfad76B0545fb3F531383c3bB7"
    : "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550"
);
export const FANTOM_NFT_BRIDGE_ADDRESS = getAddress(
  CLUSTER === "testnet"
    ? "0x63eD9318628D26BdCB15df58B53BB27231D1B227"
    : "0x26b4afb60d6c903165150c6f0aa14f8016be4aec"
);
export const FANTOM_TOKEN_BRIDGE_ADDRESS = getAddress(
  CLUSTER === "testnet"
    ? "0x599CEa2204B4FaECd584Ab1F2b6aCA137a0afbE8"
    : "0x0290FB167208Af455bB137780163b7B7a9a10C16"
);
export const KARURA_BRIDGE_ADDRESS = getAddress(
  CLUSTER === "testnet"
    ? "0xE4eacc10990ba3308DdCC72d985f2a27D20c7d03"
    : "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550"
);
export const KARURA_NFT_BRIDGE_ADDRESS = getAddress(
  CLUSTER === "testnet"
    ? "0x0A693c2D594292B6Eb89Cb50EFe4B0b63Dd2760D"
    : "0x26b4afb60d6c903165150c6f0aa14f8016be4aec"
);
export const KARURA_TOKEN_BRIDGE_ADDRESS = getAddress(
  CLUSTER === "testnet"
    ? "0xd11De1f930eA1F7Dd0290Fe3a2e35b9C91AEFb37"
    : "0x0290FB167208Af455bB137780163b7B7a9a10C16"
);
export const ACALA_BRIDGE_ADDRESS = getAddress(
  CLUSTER === "testnet"
    ? "0x4377B49d559c0a9466477195C6AdC3D433e265c0"
    : "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550"
);
export const ACALA_NFT_BRIDGE_ADDRESS = getAddress(
  CLUSTER === "testnet"
    ? "0x96f1335e0AcAB3cfd9899B30b2374e25a2148a6E"
    : "0x26b4afb60d6c903165150c6f0aa14f8016be4aec"
);
export const ACALA_TOKEN_BRIDGE_ADDRESS = getAddress(
  CLUSTER === "testnet"
    ? "0xebA00cbe08992EdD08ed7793E07ad6063c807004"
    : "0x0290FB167208Af455bB137780163b7B7a9a10C16"
);
export const KLAYTN_BRIDGE_ADDRESS = getAddress(
  CLUSTER === "testnet"
    ? "0x1830CC6eE66c84D2F177B94D544967c774E624cA"
    : "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550"
);
export const KLAYTN_NFT_BRIDGE_ADDRESS = getAddress(
  CLUSTER === "testnet"
    ? "0x94c994fC51c13101062958b567e743f1a04432dE"
    : "0x26b4afb60d6c903165150c6f0aa14f8016be4aec"
);
export const KLAYTN_TOKEN_BRIDGE_ADDRESS = getAddress(
  CLUSTER === "testnet"
    ? "0xC7A13BE098720840dEa132D860fDfa030884b09A"
    : "0x0290FB167208Af455bB137780163b7B7a9a10C16"
);
export const CELO_BRIDGE_ADDRESS = getAddress(
  CLUSTER === "testnet"
    ? "0x88505117CA88e7dd2eC6EA1E13f0948db2D50D56"
    : "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550"
);
export const CELO_NFT_BRIDGE_ADDRESS = getAddress(
  CLUSTER === "testnet"
    ? "0xaCD8190F647a31E56A656748bC30F69259f245Db"
    : "0x26b4afb60d6c903165150c6f0aa14f8016be4aec"
);
export const CELO_TOKEN_BRIDGE_ADDRESS = getAddress(
  CLUSTER === "testnet"
    ? "0x05ca6037eC51F8b712eD2E6Fa72219FEaE74E153"
    : "0x0290FB167208Af455bB137780163b7B7a9a10C16"
);
export const NEON_BRIDGE_ADDRESS = getAddress(
  CLUSTER === "testnet"
    ? CONTRACTS.TESTNET.neon.core
    : "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550"
);
export const NEON_NFT_BRIDGE_ADDRESS = getAddress(
  CLUSTER === "testnet"
    ? CONTRACTS.TESTNET.neon.nft_bridge
    : "0x26b4afb60d6c903165150c6f0aa14f8016be4aec"
);
export const NEON_TOKEN_BRIDGE_ADDRESS = getAddress(
  CLUSTER === "testnet"
    ? CONTRACTS.TESTNET.neon.token_bridge
    : "0x0290FB167208Af455bB137780163b7B7a9a10C16"
);
export const SOL_BRIDGE_ADDRESS =
  CLUSTER === "testnet"
    ? "3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5"
    : "Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o";
export const SOL_NFT_BRIDGE_ADDRESS =
  CLUSTER === "testnet"
    ? "2rHhojZ7hpu1zA91nvZmT8TqWWvMcKmmNBCr2mKTtMq4"
    : "NFTWqJR8YnRVqPDvTJrYuLrQDitTG5AScqbeghi4zSA";
export const SOL_TOKEN_BRIDGE_ADDRESS =
  CLUSTER === "testnet"
    ? "DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe"
    : "B6RHG3mfcckmrYN1UhmJzyS1XX3fZKbkeUcpJe9Sy3FE";
export const ROPSTEN_ETH_BRIDGE_ADDRESS = getAddress(
  CLUSTER === "testnet"
    ? "0x210c5F5e2AF958B4defFe715Dc621b7a3BA888c5"
    : "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550"
);
export const ROPSTEN_ETH_NFT_BRIDGE_ADDRESS = getAddress(
  CLUSTER === "testnet"
    ? "0x2b048Da40f69c8dc386a56705915f8E966fe1eba"
    : "0x26b4afb60d6c903165150c6f0aa14f8016be4aec"
);
export const ROPSTEN_ETH_TOKEN_BRIDGE_ADDRESS = getAddress(
  CLUSTER === "testnet"
    ? "0xF174F9A837536C449321df1Ca093Bb96948D5386"
    : "0x0290FB167208Af455bB137780163b7B7a9a10C16"
);

export const SOL_CUSTODY_ADDRESS =
  "GugU1tP7doLeTw9hQP51xRJyS8Da1fWxuiy2rVrnMD2m";
export const SOL_NFT_CUSTODY_ADDRESS =
  "D63bhHo634eXSj4Jq3xgu2fjB5XKc8DFHzDY9iZk7fv1";
export const TERRA_TEST_TOKEN_ADDRESS =
  "terra13nkgqrfymug724h8pprpexqj9h629sa3ncw7sh";
export const TERRA_BRIDGE_ADDRESS =
  CLUSTER === "testnet"
    ? "terra1pd65m0q9tl3v8znnz5f5ltsfegyzah7g42cx5v"
    : "terra18vd8fpwxzck93qlwghaj6arh4p7c5n896xzem5";
export const TERRA_TOKEN_BRIDGE_ADDRESS =
  CLUSTER === "testnet"
    ? "terra1pseddrv0yfsn76u4zxrjmtf45kdlmalswdv39a"
    : "terra10pyejy66429refv3g35g2t7am0was7ya7kz2a4";
export const TERRA2_BRIDGE_ADDRESS =
  CLUSTER === "testnet"
    ? CONTRACTS.TESTNET.terra2.core
    : "terra14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9ssrc8au";
export const TERRA2_TOKEN_BRIDGE_ADDRESS =
  CLUSTER === "testnet"
    ? CONTRACTS.TESTNET.terra2.token_bridge
    : "terra1nc5tatafv6eyq7llkr2gv50ff9e22mnf70qgjlv737ktmt4eswrquka9l6";
export const ALGORAND_BRIDGE_ID = BigInt(
  CLUSTER === "testnet" ? "86525623" : "4"
);
export const ALGORAND_TOKEN_BRIDGE_ID = BigInt(
  CLUSTER === "testnet" ? "86525641" : "6"
);
export const ALGORAND_WAIT_FOR_CONFIRMATIONS = CLUSTER === "testnet" ? 4 : 1;

export const getBridgeAddressForChain = (chainId: ChainId) =>
  chainId === CHAIN_ID_SOLANA
    ? SOL_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_ETH
    ? ETH_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_BSC
    ? BSC_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_TERRA
    ? TERRA_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_TERRA2
    ? TERRA2_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_POLYGON
    ? POLYGON_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_ETHEREUM_ROPSTEN
    ? ROPSTEN_ETH_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_AVAX
    ? AVAX_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_OASIS
    ? OASIS_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_AURORA
    ? AURORA_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_FANTOM
    ? FANTOM_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_KARURA
    ? KARURA_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_ACALA
    ? ACALA_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_KLAYTN
    ? KLAYTN_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_CELO
    ? CELO_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_NEON
    ? NEON_BRIDGE_ADDRESS
    : "";
export const getNFTBridgeAddressForChain = (chainId: ChainId) =>
  chainId === CHAIN_ID_SOLANA
    ? SOL_NFT_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_ETH
    ? ETH_NFT_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_BSC
    ? BSC_NFT_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_POLYGON
    ? POLYGON_NFT_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_ETHEREUM_ROPSTEN
    ? ROPSTEN_ETH_NFT_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_AVAX
    ? AVAX_NFT_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_OASIS
    ? OASIS_NFT_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_AURORA
    ? AURORA_NFT_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_FANTOM
    ? FANTOM_NFT_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_KARURA
    ? KARURA_NFT_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_ACALA
    ? ACALA_NFT_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_KLAYTN
    ? KLAYTN_NFT_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_CELO
    ? CELO_NFT_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_NEON
    ? NEON_NFT_BRIDGE_ADDRESS
    : "";
export const getTokenBridgeAddressForChain = (chainId: ChainId) =>
  chainId === CHAIN_ID_SOLANA
    ? SOL_TOKEN_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_ETH
    ? ETH_TOKEN_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_BSC
    ? BSC_TOKEN_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_TERRA
    ? TERRA_TOKEN_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_TERRA2
    ? TERRA2_TOKEN_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_POLYGON
    ? POLYGON_TOKEN_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_ETHEREUM_ROPSTEN
    ? ROPSTEN_ETH_TOKEN_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_AVAX
    ? AVAX_TOKEN_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_OASIS
    ? OASIS_TOKEN_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_AURORA
    ? AURORA_TOKEN_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_FANTOM
    ? FANTOM_TOKEN_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_KARURA
    ? KARURA_TOKEN_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_ACALA
    ? ACALA_TOKEN_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_KLAYTN
    ? KLAYTN_TOKEN_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_CELO
    ? CELO_TOKEN_BRIDGE_ADDRESS
    : chainId === CHAIN_ID_NEON
    ? NEON_TOKEN_BRIDGE_ADDRESS
    : "";

export const COVALENT_API_KEY = process.env.REACT_APP_COVALENT_API_KEY
  ? process.env.REACT_APP_COVALENT_API_KEY
  : "";

export const COVALENT_ETHEREUM = 1; // Covalent only supports mainnet and Kovan
export const COVALENT_BSC = CLUSTER === "devnet" ? 56 : BSC_NETWORK_CHAIN_ID;
export const COVALENT_POLYGON =
  CLUSTER === "devnet" ? 137 : POLYGON_NETWORK_CHAIN_ID;
export const COVALENT_AVAX = CLUSTER === "devnet" ? 137 : AVAX_NETWORK_CHAIN_ID;
export const COVALENT_FANTOM =
  CLUSTER === "devnet" ? 250 : FANTOM_NETWORK_CHAIN_ID;
export const COVALENT_KLAYTN = null; // Covalent only support mainnet
export const COVALENT_CELO = CLUSTER === "devnet" ? null : null;
export const COVALENT_NEON = CLUSTER === "devnet" ? null : null;
export const COVALENT_GET_TOKENS_URL = (
  chainId: ChainId,
  walletAddress: string,
  nft?: boolean,
  noNftMetadata?: boolean
) => {
  const chainNum =
    chainId === CHAIN_ID_ETH || chainId === CHAIN_ID_ETHEREUM_ROPSTEN
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

export const ROPSTEN_WETH_ADDRESS =
  CLUSTER === "testnet"
    ? "0xc778417e063141139fce010982780140aa0cd5ab"
    : "0xDDb64fE46a91D46ee29420539FC25FD07c5FEa3E";
export const ROPSTEN_WETH_DECIMALS = 18;

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
    ? "0x762ac6e8183db5a8e912a66fcc1a09f5a7ac96a9"
    : "0xDDb64fE46a91D46ee29420539FC25FD07c5FEa3E";
export const WKLAY_DECIMALS = 18;

export const CELO_ADDRESS =
  CLUSTER === "testnet"
    ? "0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9"
    : "0xDDb64fE46a91D46ee29420539FC25FD07c5FEa3E";
export const CELO_DECIMALS = 18;

export const WNEON_ADDRESS =
  CLUSTER === "testnet"
    ? "0xf8aD328E98f85fccbf09E43B16dcbbda7E84BEAB"
    : "0xDDb64fE46a91D46ee29420539FC25FD07c5FEa3E";
export const WNEON_DECIMALS = 18;

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

export const WORMHOLE_EXPLORER_BASE = "https://wormholenetwork.com/en/explorer";

export const SOLANA_SYSTEM_PROGRAM_ADDRESS = "11111111111111111111111111111111";

export const getHowToAddTokensToWalletUrl = (chainId: ChainId) => {
  if (isEVMChain(chainId)) {
    return "https://docs.wormholenetwork.com/wormhole/video-tutorial-how-to-manually-add-tokens-to-your-wallet#1.-metamask-ethereum-polygon-and-bsc";
  } else if (isTerraChain(chainId)) {
    return "https://docs.wormholenetwork.com/wormhole/video-tutorial-how-to-manually-add-tokens-to-your-wallet#2.-terra-station";
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
  CLUSTER === "testnet"
    ? "https://relayer.aca-dev.network"
    : // ? "http://localhost:3111"
      "";

export const ACALA_RELAY_URL = `${ACALA_RELAYER_URL}/relay`;
export const ACALA_SHOULD_RELAY_URL = `${ACALA_RELAYER_URL}/shouldRelay`;

export const getChainShortName = (chainId: ChainId) => {
  return chainId === CHAIN_ID_BSC ? "BSC" : CHAINS_BY_ID[chainId]?.name;
};

export const COLOR_BY_CHAIN_ID: { [key in ChainId]?: string } = {
  [CHAIN_ID_SOLANA]: "#31D7BB",
  [CHAIN_ID_ETH]: "#8A92B2",
  [CHAIN_ID_TERRA]: "#5493F7",
  [CHAIN_ID_BSC]: "#F0B90B",
  [CHAIN_ID_POLYGON]: "#8247E5",
  [CHAIN_ID_AVAX]: "#E84142",
  [CHAIN_ID_OASIS]: "#0092F6",
  [CHAIN_ID_AURORA]: "#23685A",
  [CHAIN_ID_FANTOM]: "#1969FF",
  [CHAIN_ID_KARURA]: "#FF4B3B",
  [CHAIN_ID_ACALA]: "#E00F51",
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
