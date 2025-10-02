import { useState, useCallback } from 'react';
import { SwapParams, SwapStatus, QuoteResponse } from '../types';
import { useVeloraSDK } from './useVeloraSDK';

interface UseCrossChainSwapProps {
  chainId: number;
  provider: any;
  signer: any;
  address: string | null;
}

export const useCrossChainSwap = ({ chainId, provider, signer, address }: UseCrossChainSwapProps) => {
  const [swapStatus, setSwapStatus] = useState<SwapStatus>({
    status: 'idle',
    message: '',
  });
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [bridgeInfo, setBridgeInfo] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<Error | null>(null);

  const veloraSDK = useVeloraSDK({
    chainId,
    provider,
    signer,
    address,
  });

  const { getBridgeInfo, getDeltaPrice, approveTokenForDelta, submitDeltaOrder, getDeltaOrderById } = veloraSDK;

  const loadBridgeInfo = useCallback(async () => {
    try {
      console.log('Loading bridge info...');
      const info = await getBridgeInfo();
      setBridgeInfo(info);
      console.log('Bridge info loaded successfully:', info);
      return info;
    } catch (error) {
      console.error('Failed to load bridge info:', error);
      // Don't throw error, just log it and continue
      console.log('Continuing without bridge info...');
      return null;
    }
  }, [getBridgeInfo]);

  const getQuote = useCallback(async (params: SwapParams, retryAttempt = 0) => {
    const maxRetries = 3;
    const retryDelay = Math.min(1000 * Math.pow(2, retryAttempt), 5000); // Exponential backoff, max 5s
    
    try {
      setSwapStatus({ status: 'loading', message: `Getting quote${retryAttempt > 0 ? ` (attempt ${retryAttempt + 1})` : ''}...` });
      setLastError(null);
      
      const isCrossChain = params.srcChain.id !== params.destChain.id;
      
      console.log('Attempting to get quote with params:', {
        srcToken: params.srcToken.address,
        destToken: params.destToken.address,
        srcChain: params.srcChain.id,
        destChain: params.destChain.id,
        amount: params.amount,
        isCrossChain,
        retryAttempt
      });

      let quoteResponse: QuoteResponse;

      if (isCrossChain) {
        // For cross-chain swaps, use getDeltaPrice with destChainId
        const deltaPriceParams = {
          srcToken: params.srcToken.address,
          destToken: params.destToken.address,
          destChainId: params.destChain.id,
          amount: params.amount,
          userAddress: address!,
          srcDecimals: params.srcToken.decimals,
          destDecimals: params.destToken.decimals,
        };

        console.log('Getting cross-chain delta price with params:', deltaPriceParams);
        const deltaPrice = await getDeltaPrice(deltaPriceParams);
        console.log('Raw delta price response:', JSON.stringify(deltaPrice, null, 2));
        
        quoteResponse = {
          delta: deltaPrice,
          deltaAddress: ''
        };
      } else {
        // For same-chain swaps, use getQuote with 'all' mode
        const quoteParams = {
          srcToken: params.srcToken.address,
          destToken: params.destToken.address,
          amount: params.amount,
          userAddress: address!,
          srcDecimals: params.srcToken.decimals,
          destDecimals: params.destToken.decimals,
          mode: 'all' as const,
        };

        console.log('Getting same-chain quote with params:', quoteParams);
        quoteResponse = await veloraSDK.getQuote(quoteParams);
        console.log('Raw quote response:', JSON.stringify(quoteResponse, null, 2));
      }
      
      console.log('Formatted quote response:', JSON.stringify(quoteResponse, null, 2));
      setQuote(quoteResponse);
      setSwapStatus({ status: 'idle', message: '' });
      setRetryCount(0);
      return quoteResponse;
    } catch (error) {
      console.error('Error in getQuote:', error);
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      
      const errorObj = error instanceof Error ? error : new Error(String(error));
      setLastError(errorObj);
      
      // Retry logic for network errors
      if (retryAttempt < maxRetries && (
        errorObj.message.includes('network') ||
        errorObj.message.includes('timeout') ||
        errorObj.message.includes('fetch') ||
        errorObj.message.includes('ECONNREFUSED') ||
        errorObj.message.includes('ENOTFOUND')
      )) {
        console.log(`Retrying quote request in ${retryDelay}ms (attempt ${retryAttempt + 1}/${maxRetries})`);
        setRetryCount(retryAttempt + 1);
        
        setTimeout(() => {
          getQuote(params, retryAttempt + 1);
        }, retryDelay);
        return;
      }
      
      let errorMessage = 'Failed to get quote';
      if (errorObj.message) {
        errorMessage = errorObj.message;
      }
      
      if (retryAttempt > 0) {
        errorMessage += ` (after ${retryAttempt + 1} attempts)`;
      }
      
      setSwapStatus({ status: 'failed', message: errorMessage });
      throw errorObj;
    }
  }, [getDeltaPrice, veloraSDK, address]);

  const executeSwap = useCallback(async (params: SwapParams) => {
    try {
      setSwapStatus({ status: 'loading', message: 'Preparing swap...' });

      // Get quote first
      const quoteResponse = await getQuote(params);
      
      if (!quoteResponse?.delta) {
        throw new Error('Delta quote not available');
      }

      // Approve token
      setSwapStatus({ status: 'approving', message: 'Approving token...' });
      const approveTx = await approveTokenForDelta(params.amount, params.srcToken.address);
      // Wait for transaction confirmation
      if (approveTx && typeof approveTx === 'object' && 'wait' in approveTx) {
        await (approveTx as any).wait();
      }

      // Calculate destination amount with slippage
      const slippageMultiplier = (100 - params.slippage) / 100;
      const destAmount = quoteResponse?.delta?.destAmount || '0';
      const destAmountAfterSlippage = Math.floor(
        parseFloat(destAmount) * slippageMultiplier
      ).toString();

      // Submit delta order
      setSwapStatus({ status: 'submitting', message: 'Submitting cross-chain order...' });
      const deltaAuction = await submitDeltaOrder({
        deltaPrice: quoteResponse.delta,
        owner: address!,
        srcToken: params.srcToken.address,
        destToken: params.destToken.address,
        srcAmount: params.amount,
        destAmount: destAmountAfterSlippage,
        destChainId: params.destChain.id,
        beneficiary: params.recipient || address!,
        beneficiaryType: 'EOA',
      });

      setSwapStatus({
        status: 'executing',
        message: 'Order submitted! Monitoring execution...',
        auctionId: deltaAuction.id,
      });

      return deltaAuction;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Swap failed';
      setSwapStatus({ status: 'failed', message: errorMessage });
      throw error;
    }
  }, [getQuote, approveTokenForDelta, submitDeltaOrder, address]);

  const monitorSwap = useCallback(async (auctionId: string) => {
    try {
      const auction = await getDeltaOrderById(auctionId);
      
      if (auction.status === 'EXECUTED') {
        if (auction.order.bridge.destinationChainId !== 0) {
          // Cross-chain order
          if (auction.bridgeStatus === 'filled') {
            setSwapStatus({
              status: 'completed',
              message: 'Cross-chain swap completed successfully!',
              auctionId,
              bridgeStatus: auction.bridgeStatus,
            });
            return true;
          } else if (auction.bridgeStatus === 'expired' || auction.bridgeStatus === 'refunded') {
            setSwapStatus({
              status: 'failed',
              message: `Bridge failed: ${auction.bridgeStatus}`,
              auctionId,
              bridgeStatus: auction.bridgeStatus,
            });
            return true;
          }
        } else {
          // Same-chain order
          setSwapStatus({
            status: 'completed',
            message: 'Swap completed successfully!',
            auctionId,
          });
          return true;
        }
      } else if (auction.status === 'FAILED' || auction.status === 'CANCELLED') {
        setSwapStatus({
          status: 'failed',
          message: `Order ${auction.status.toLowerCase()}`,
          auctionId,
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to monitor swap:', error);
      return false;
    }
  }, [getDeltaOrderById]);

  const resetSwap = useCallback(() => {
    setSwapStatus({ status: 'idle', message: '' });
    setQuote(null);
    setRetryCount(0);
    setLastError(null);
  }, []);

  const retryQuote = useCallback(() => {
    if (lastError) {
      setRetryCount(0);
      setLastError(null);
    }
  }, [lastError]);

  return {
    swapStatus,
    quote,
    bridgeInfo,
    retryCount,
    lastError,
    loadBridgeInfo,
    getQuote,
    executeSwap,
    monitorSwap,
    resetSwap,
    retryQuote,
  };
};
