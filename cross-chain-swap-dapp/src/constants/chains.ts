import { Chain } from '../types';

// All Velora-supported chains based on API documentation
export const VELORA_SUPPORTED_CHAINS: Chain[] = [
  {
    id: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    rpcUrl: 'https://eth.llamarpc.com',
    blockExplorer: 'https://etherscan.io',
    logoURI: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  {
    id: 10,
    name: 'Optimism',
    symbol: 'OP',
    rpcUrl: 'https://mainnet.optimism.io',
    blockExplorer: 'https://optimistic.etherscan.io',
    logoURI: 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.png',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  {
    id: 56,
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    blockExplorer: 'https://bscscan.com',
    logoURI: 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
  },
  {
    id: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    logoURI: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
  },
  {
    id: 250,
    name: 'Fantom',
    symbol: 'FTM',
    rpcUrl: 'https://rpc.ftm.tools',
    blockExplorer: 'https://ftmscan.com',
    logoURI: 'https://cryptologos.cc/logos/fantom-ftm-logo.png',
    nativeCurrency: {
      name: 'Fantom',
      symbol: 'FTM',
      decimals: 18,
    },
  },
  {
    id: 1101,
    name: 'Polygon zkEVM',
    symbol: 'ETH',
    rpcUrl: 'https://zkevm-rpc.com',
    blockExplorer: 'https://zkevm.polygonscan.com',
    logoURI: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  {
    id: 8453,
    name: 'Base',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    logoURI: 'https://cryptologos.cc/logos/base-base-logo.png',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  {
    id: 42161,
    name: 'Arbitrum One',
    symbol: 'ETH',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io',
    logoURI: 'https://cryptologos.cc/logos/arbitrum-arb-logo.png',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  {
    id: 43114,
    name: 'Avalanche',
    symbol: 'AVAX',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    blockExplorer: 'https://snowtrace.io',
    logoURI: 'https://cryptologos.cc/logos/avalanche-avax-logo.png',
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18,
    },
  },
  {
    id: 100,
    name: 'Gnosis',
    symbol: 'GNO',
    rpcUrl: 'https://rpc.gnosischain.com',
    blockExplorer: 'https://gnosisscan.io',
    logoURI: 'https://cryptologos.cc/logos/gnosis-gno-logo.png',
    nativeCurrency: {
      name: 'Gnosis',
      symbol: 'GNO',
      decimals: 18,
    },
  },
];

// Legacy support for existing code
export const SUPPORTED_CHAINS = VELORA_SUPPORTED_CHAINS;

export const getChainById = (chainId: number): Chain | undefined => {
  return VELORA_SUPPORTED_CHAINS.find(chain => chain.id === chainId);
};

export const getChainIds = (): number[] => {
  return VELORA_SUPPORTED_CHAINS.map(chain => chain.id);
};

export const isChainSupported = (chainId: number): boolean => {
  return VELORA_SUPPORTED_CHAINS.some(chain => chain.id === chainId);
};





