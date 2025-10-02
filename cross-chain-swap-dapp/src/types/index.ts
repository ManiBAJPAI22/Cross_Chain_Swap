export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  chainId: number;
}

export interface Chain {
  id: number;
  name: string;
  symbol: string;
  rpcUrl: string;
  blockExplorer: string;
  logoURI?: string;
}

export interface SwapParams {
  srcToken: Token;
  destToken: Token;
  srcChain: Chain;
  destChain: Chain;
  amount: string;
  slippage: number;
  recipient?: string;
}

export interface SwapStatus {
  status: 'idle' | 'loading' | 'approving' | 'submitting' | 'executing' | 'completed' | 'failed';
  message: string;
  txHash?: string;
  auctionId?: string;
  bridgeStatus?: 'pending' | 'filled' | 'expired' | 'refunded';
}

export interface DeltaAuction {
  id: string;
  status: string;
  bridgeStatus?: string;
  order: {
    bridge: {
      destinationChainId: number;
    };
  };
}

export interface BridgeInfo {
  [srcChainId: number]: {
    [destChainId: number]: string[];
  };
}

export type BeneficiaryType = 'EOA' | 'CONTRACT';

export interface QuoteResponse {
  delta?: {
    destAmount: string;
    bridgeFee: string;
    bridgeInfo: {
      destAmountAfterBridge: string;
      fees: Array<{
        amount: string;
        amountInUSD: string;
      }>;
    };
  };
  market?: {
    destAmount: string;
  };
  fallbackReason?: {
    errorType: string;
    details: string;
  };
}
