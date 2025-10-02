import { Token } from '../types';

interface ApiToken {
  symbol: string;
  address: string;
  decimals: number;
  img: string;
  network: number;
}

interface TokenListResponse {
  tokens: ApiToken[];
}

// Cache for token lists to avoid repeated API calls
const tokenCache = new Map<number, Token[]>();

export const fetchTokensForNetwork = async (networkId: number): Promise<Token[]> => {
  // Check cache first
  if (tokenCache.has(networkId)) {
    return tokenCache.get(networkId)!;
  }

  try {
    console.log(`Fetching tokens for network ${networkId}...`);
    const response = await fetch(`https://api.paraswap.io/tokens/${networkId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tokens for network ${networkId}: ${response.statusText}`);
    }

    const data: TokenListResponse = await response.json();
    
    // Convert API tokens to our Token format
    const tokens: Token[] = data.tokens.map(apiToken => ({
      address: apiToken.address,
      symbol: apiToken.symbol,
      name: apiToken.symbol, // API doesn't provide full name, use symbol
      decimals: apiToken.decimals,
      chainId: apiToken.network,
      logoURI: apiToken.img,
    }));

    // Cache the result
    tokenCache.set(networkId, tokens);
    
    console.log(`Fetched ${tokens.length} tokens for network ${networkId}`);
    return tokens;
  } catch (error) {
    console.error(`Error fetching tokens for network ${networkId}:`, error);
    
    // Return fallback tokens if API fails
    return getFallbackTokensForNetwork(networkId);
  }
};

// Fallback tokens in case API is unavailable
const getFallbackTokensForNetwork = (networkId: number): Token[] => {
  const fallbackTokens: Record<number, Token[]> = {
    1: [ // Ethereum
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
    ],
    10: [ // Optimism
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
    ],
    137: [ // Polygon
      {
        address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        chainId: 137,
        logoURI: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
      },
    ],
    42161: [ // Arbitrum
      {
        address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        chainId: 42161,
        logoURI: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
      },
    ],
  };

  return fallbackTokens[networkId] || [];
};

// Get tokens that can be used as source tokens (excludes native tokens for Delta protocol)
export const getSourceTokensForNetwork = async (networkId: number): Promise<Token[]> => {
  const allTokens = await fetchTokensForNetwork(networkId);
  return allTokens.filter(token => 
    token.address !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' &&
    token.address !== '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' // Alternative native token address
  );
};

// Get tokens that can be used as destination tokens (includes all tokens)
export const getDestTokensForNetwork = async (networkId: number): Promise<Token[]> => {
  return await fetchTokensForNetwork(networkId);
};

// Check if a token is a native token (not supported as source in Delta)
export const isNativeToken = (token: Token): boolean => {
  return token.address === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' ||
         token.address === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
};

// Clear cache (useful for testing or when you want fresh data)
export const clearTokenCache = () => {
  tokenCache.clear();
};


