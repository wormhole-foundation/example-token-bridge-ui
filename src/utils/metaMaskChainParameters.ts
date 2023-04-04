// https://docs.metamask.io/guide/rpc-api.html#wallet-addethereumchain as per EIP-3085
export interface AddEthereumChainParameter {
  chainId: string; // A 0x-prefixed hexadecimal string
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string; // 2-6 characters long
    decimals: 18;
  };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
  iconUrls?: string[]; // Currently ignored.
}

// https://chainid.network/chains.json for chain info
export const METAMASK_CHAIN_PARAMETERS: {
  [evmChainId: number]: AddEthereumChainParameter;
} = {
  3: {
    chainId: "0x3",
    chainName: "Ropsten",
    nativeCurrency: { name: "Ropsten Ether", symbol: "ROP", decimals: 18 },
    rpcUrls: ["https://rpc.ankr.com/eth_ropsten"],
    blockExplorerUrls: ["https://ropsten.etherscan.io"],
  },
  5: {
    chainId: "0x5",
    chainName: "Görli",
    nativeCurrency: { name: "Görli Ether", symbol: "GOR", decimals: 18 },
    rpcUrls: ["https://rpc.ankr.com/eth_goerli"],
    blockExplorerUrls: ["https://goerli.etherscan.io"],
  },
  11155111: {
    chainId: "0xAA36A7",
    chainName: "Sepolia",
    nativeCurrency: { name: "Sepolia Ether", symbol: "SEP", decimals: 18 },
    rpcUrls: ["https://rpc.sepolia.org"],
    blockExplorerUrls: ["https://sepolia.etherscan.io"],
  },
  97: {
    chainId: "0x61",
    chainName: "Binance Smart Chain Testnet",
    nativeCurrency: {
      name: "Binance Chain Native Token",
      symbol: "BNB",
      decimals: 18,
    },
    rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545"],
    blockExplorerUrls: ["https://testnet.bscscan.com"],
  },
  596: {
    chainId: "0x254",
    chainName: "Karura Testnet",
    nativeCurrency: { name: "Karura Token", symbol: "KAR", decimals: 18 },
    rpcUrls: ["https://karura-dev.aca-dev.network/eth/http"],
    blockExplorerUrls: ["https://blockscout.karura-dev.aca-dev.network"],
  },
  597: {
    chainId: "0x255",
    chainName: "Acala Testnet",
    nativeCurrency: { name: "Acala Token", symbol: "ACA", decimals: 18 },
    rpcUrls: ["https://acala-dev.aca-dev.network/eth/http"],
    blockExplorerUrls: ["https://blockscout.acala-dev.aca-dev.network"],
  },
  4002: {
    chainId: "0xfa2",
    chainName: "Fantom Testnet",
    nativeCurrency: { name: "Fantom", symbol: "FTM", decimals: 18 },
    rpcUrls: ["https://rpc.testnet.fantom.network"],
    blockExplorerUrls: ["https://testnet.ftmscan.com"],
  },
  1001: {
    chainId: "0x3E9",
    chainName: "Klaytn Testnet Baobab",
    nativeCurrency: { name: "Klay", symbol: "KLAY", decimals: 18 },
    rpcUrls: ["https://api.baobab.klaytn.net:8651"],
    blockExplorerUrls: ["https://baobab.scope.klaytn.com/"],
  },
  44787: {
    chainId: "0xaef3",
    chainName: "Celo (Alfajores Testnet)",
    nativeCurrency: { name: "Celo", symbol: "CELO", decimals: 18 },
    rpcUrls: ["https://alfajores-forno.celo-testnet.org"],
    blockExplorerUrls: ["https://alfajores-blockscout.celo-testnet.org"],
  },
  42261: {
    chainId: "0xa515",
    chainName: "Emerald Paratime Testnet",
    nativeCurrency: { name: "Emerald Rose", symbol: "ROSE", decimals: 18 },
    rpcUrls: ["https://testnet.emerald.oasis.dev"],
    blockExplorerUrls: ["https://testnet.explorer.emerald.oasis.dev"],
  },
  43113: {
    chainId: "0xa869",
    chainName: "Avalanche Fuji Testnet",
    nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
    rpcUrls: ["https://api.avax-test.network/ext/bc/C/rpc"],
    blockExplorerUrls: ["https://testnet.snowtrace.io"],
  },
  80001: {
    chainId: "0x13881",
    chainName: "Mumbai",
    nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
    rpcUrls: ["https://rpc-mumbai.maticvigil.com"],
    blockExplorerUrls: ["https://mumbai.polygonscan.com"],
  },
  421613: {
    chainId: "0x66EED",
    chainName: "Arbitrum Görli",
    nativeCurrency: { name: "AGOR", symbol: "AGOR", decimals: 18 },
    rpcUrls: ["https://goerli-rollup.arbitrum.io/rpc"],
    blockExplorerUrls: ["https://goerli.arbiscan.io"],
  },
  245022926: {
    chainId: "0xE9AC0CE",
    chainName: "remote proxy — solana devnet",
    nativeCurrency: { name: "NEON", symbol: "NEON", decimals: 18 },
    rpcUrls: ["https://proxy.devnet.neonlabs.org/solana"],
    blockExplorerUrls: ["https://neonscan.org/"],
  },
  1313161555: {
    chainId: "0x4e454153",
    chainName: "Aurora Testnet",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://testnet.aurora.dev"],
    blockExplorerUrls: ["https://testnet.aurorascan.dev"],
  },
  1287: {
    chainId: "0x507",
    chainName: "Moonbase Alpha",
    nativeCurrency: { name: "Dev", symbol: "DEV", decimals: 18 },
    rpcUrls: ["https://rpc.api.moonbase.moonbeam.network"],
    blockExplorerUrls: ["https://moonbase.moonscan.io"],
  },
  84531: {
    chainId: "0x14A33",
    chainName: "Base Goerli",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://goerli.base.org"],
    blockExplorerUrls: ["https://goerli.basescan.org"],
  },
  420: {
    chainId: "0x1056",
    chainName: "Optimism Goerli",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://goerli.optimism.io"],
    blockExplorerUrls: ["https://goerli-optimism.etherscan.io"],
  },
};

export interface EvmRpcMap {
  [chainId: string]: string;
}

export const EVM_RPC_MAP = Object.entries(METAMASK_CHAIN_PARAMETERS).reduce(
  (evmRpcMap, [evmChainId, { rpcUrls }]) => {
    if (rpcUrls.length > 0) {
      evmRpcMap[evmChainId] = rpcUrls[0];
    }
    return evmRpcMap;
  },
  {} as EvmRpcMap
);
