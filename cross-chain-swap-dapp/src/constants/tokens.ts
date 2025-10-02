import { Token } from '../types';

export const POPULAR_TOKENS: Token[] = [
  // Ethereum
  {
    address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    chainId: 1,
    logoURI: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  },
  {
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    chainId: 1,
    logoURI: 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png',
  },
  {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    chainId: 1,
    logoURI: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
  },
  {
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    chainId: 1,
    logoURI: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
  },
  
  // Optimism
  {
    address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    chainId: 10,
    logoURI: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  },
  {
    address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    chainId: 10,
    logoURI: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
  },
  {
    address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    chainId: 10,
    logoURI: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
  },
  
  // Polygon
  {
    address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    symbol: 'MATIC',
    name: 'Polygon',
    decimals: 18,
    chainId: 137,
    logoURI: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
  },
  {
    address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    chainId: 137,
    logoURI: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
  },
  
  // Arbitrum
  {
    address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    chainId: 42161,
    logoURI: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  },
  {
    address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    chainId: 42161,
    logoURI: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
  },
];

export const getTokensByChain = (chainId: number): Token[] => {
  return POPULAR_TOKENS.filter(token => token.chainId === chainId);
};

export const getTokenByAddress = (address: string, chainId: number): Token | undefined => {
  return POPULAR_TOKENS.find(token => 
    token.address.toLowerCase() === address.toLowerCase() && token.chainId === chainId
  );
};


