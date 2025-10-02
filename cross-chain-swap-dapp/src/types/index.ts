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

// Import types from SDK for better type safety
export interface BridgeQuoteFee {
  feeToken: string;
  amount: string;
  amountInSrcToken: string;
  amountInUSD: string;
}

export interface BridgePriceInfo {
  protocolName: 'Across' | 'StargateBus' | 'StargateTaxi';
  destAmountAfterBridge: string;
  destUSDAfterBridge: string;
  fees: BridgeQuoteFee[];
  estimatedTimeMs: number;
}

export interface DeltaPrice {
  srcToken: string;
  destToken: string;
  srcAmount: string;
  srcAmountBeforeFee?: string;
  destAmount: string;
  destAmountBeforeFee?: string;
  gasCost: string;
  gasCostBeforeFee: string;
  gasCostUSD: string;
  gasCostUSDBeforeFee: string;
  srcUSD: string;
  srcUSDBeforeFee?: string;
  destUSD: string;
  destUSDBeforeFee?: string;
  partner: string;
  partnerFee: number;
  hmac: string;
  bridge: {
    protocolSelector: string;
    destinationChainId: number;
    outputToken: string;
    scalingFactor: number;
    protocolData: string;
  };
}

export interface BridgePrice extends Omit<DeltaPrice, 'bridge'> {
  bridge: {
    protocolSelector: string;
    destinationChainId: number;
    outputToken: string;
    scalingFactor: number;
    protocolData: string;
  };
  bridgeInfo: BridgePriceInfo;
}

export interface QuoteResponse {
  delta?: DeltaPrice | BridgePrice;
  deltaAddress?: string;
  market?: {
    destAmount: string;
    [key: string]: any; // Allow for additional market properties
  };
  fallbackReason?: {
    errorType: string;
    details: string;
  };
}
