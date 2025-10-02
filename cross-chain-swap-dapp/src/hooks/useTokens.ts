import { useState, useEffect, useCallback } from 'react';
import { Token } from '../types';
import { 
  getSourceTokensForNetwork, 
  getDestTokensForNetwork, 
  isNativeToken as checkIsNativeToken 
} from '../services/tokenService';

interface UseTokensProps {
  chainId: number | null;
}

export const useTokens = ({ chainId }: UseTokensProps) => {
  const [sourceTokens, setSourceTokens] = useState<Token[]>([]);
  const [destTokens, setDestTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTokens = useCallback(async (networkId: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Loading tokens for network ${networkId}...`);
      
      const [srcTokens, dstTokens] = await Promise.all([
        getSourceTokensForNetwork(networkId),
        getDestTokensForNetwork(networkId)
      ]);
      
      setSourceTokens(srcTokens);
      setDestTokens(dstTokens);
      
      console.log(`Loaded ${srcTokens.length} source tokens and ${dstTokens.length} destination tokens for network ${networkId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tokens';
      console.error('Error loading tokens:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load tokens when chainId changes
  useEffect(() => {
    if (chainId) {
      loadTokens(chainId);
    } else {
      setSourceTokens([]);
      setDestTokens([]);
    }
  }, [chainId, loadTokens]);

  const isNativeToken = useCallback((token: Token) => {
    return checkIsNativeToken(token);
  }, []);

  return {
    sourceTokens,
    destTokens,
    isLoading,
    error,
    loadTokens,
    isNativeToken,
  };
};
