import { VELORA_SUPPORTED_CHAINS, getChainById } from '../constants/chains';
import { Chain } from '../types';

/**
 * Service for managing chain-related operations
 */
export class ChainService {
  /**
   * Get all supported chains
   */
  static getAllChains(): Chain[] {
    return VELORA_SUPPORTED_CHAINS;
  }

  /**
   * Get chain by ID
   */
  static getChainById(chainId: number): Chain | undefined {
    return getChainById(chainId);
  }

  /**
   * Check if a chain is supported
   */
  static isChainSupported(chainId: number): boolean {
    return VELORA_SUPPORTED_CHAINS.some(chain => chain.id === chainId);
  }

  /**
   * Get chain IDs for all supported chains
   */
  static getSupportedChainIds(): number[] {
    return VELORA_SUPPORTED_CHAINS.map(chain => chain.id);
  }

  /**
   * Get chains that support Delta protocol (cross-chain swaps)
   */
  static getDeltaSupportedChains(): Chain[] {
    // All Velora-supported chains support Delta protocol
    return VELORA_SUPPORTED_CHAINS;
  }

  /**
   * Get chains that support Market protocol (same-chain swaps)
   */
  static getMarketSupportedChains(): Chain[] {
    // All Velora-supported chains support Market protocol
    return VELORA_SUPPORTED_CHAINS;
  }

  /**
   * Get popular chains (most commonly used)
   */
  static getPopularChains(): Chain[] {
    const popularChainIds = [1, 137, 42161, 10, 56]; // Ethereum, Polygon, Arbitrum, Optimism, BSC
    return VELORA_SUPPORTED_CHAINS.filter(chain => 
      popularChainIds.includes(chain.id)
    );
  }

  /**
   * Search chains by name or symbol
   */
  static searchChains(query: string): Chain[] {
    const lowercaseQuery = query.toLowerCase();
    return VELORA_SUPPORTED_CHAINS.filter(chain => 
      chain.name.toLowerCase().includes(lowercaseQuery) ||
      chain.symbol.toLowerCase().includes(lowercaseQuery)
    );
  }

  /**
   * Get chain display name with symbol
   */
  static getChainDisplayName(chain: Chain): string {
    return `${chain.name} (${chain.symbol})`;
  }

  /**
   * Get chain logo URL with fallback
   */
  static getChainLogoUrl(chain: Chain): string {
    return chain.logoURI || `https://cryptologos.cc/logos/${chain.symbol.toLowerCase()}-logo.png`;
  }
}
