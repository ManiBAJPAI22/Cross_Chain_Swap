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

  const { 
    getBridgeInfo, 
    getDeltaPrice, 
    approveTokenForDelta, 
    buildDeltaOrder,
    signDeltaOrder,
    postDeltaOrder,
    getPartnerFee,
    isTokenSupportedInDelta,
    getDeltaOrderById 
  } = veloraSDK;

  const loadBridgeInfo = useCallback(async () => {
    try {
      const info = await getBridgeInfo();
      setBridgeInfo(info);
      return info;
    } catch (error) {
      // Don't throw error, just continue without bridge info
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

        const bridgePrice = await getDeltaPrice(deltaPriceParams);
        
        // BridgePrice has a different structure than DeltaPrice
        // Convert BridgePrice to our QuoteResponse format
        quoteResponse = {
          delta: {
            destAmount: bridgePrice.destAmount,
            bridgeFee: bridgePrice.bridgeInfo?.fees?.[0]?.amount || '0',
            bridgeInfo: bridgePrice.bridgeInfo || {
              destAmountAfterBridge: bridgePrice.destAmount,
              fees: []
            }
          },
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

        const rawQuote = await veloraSDK.getQuote(quoteParams);
        
        // Handle different response structures from getQuote
        if ('delta' in rawQuote) {
          quoteResponse = {
            delta: rawQuote.delta,
            deltaAddress: ''
          };
        } else if ('market' in rawQuote) {
          quoteResponse = {
            market: rawQuote.market,
            fallbackReason: 'fallbackReason' in rawQuote ? rawQuote.fallbackReason : undefined
          };
        } else {
          // Fallback for unexpected structure
          quoteResponse = rawQuote as QuoteResponse;
        }
      }
      
      setQuote(quoteResponse);
      setSwapStatus({ status: 'idle', message: '' });
      setRetryCount(0);
      return quoteResponse;
    } catch (error) {
      
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
      const approveTxHash = await approveTokenForDelta(params.amount, params.srcToken.address);
      
      // Wait for transaction confirmation
      setSwapStatus({ status: 'approving', message: 'Waiting for approval confirmation...' });
      const receipt = await provider.waitForTransaction(approveTxHash);
      
      if (receipt.status === 0) {
        throw new Error('Token approval failed');
      }

      // Calculate destination amount with slippage
      const slippageMultiplier = (100 - params.slippage) / 100;
      const destAmount = quoteResponse?.delta?.destAmount || '0';
      const destAmountAfterSlippage = Math.floor(
        parseFloat(destAmount) * slippageMultiplier
      ).toString();

      // Build and submit delta order using correct SDK flow
      setSwapStatus({ status: 'submitting', message: 'Building Delta order...' });
      
      const isCrossChain = params.srcChain.id !== params.destChain.id;
      let deltaAuction;
      
      if (isCrossChain) {
        // For cross-chain swaps, use buildDeltaOrder with destChainId
        const orderData = await buildDeltaOrder({
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
        
        setSwapStatus({ status: 'submitting', message: 'Signing Delta order...' });
        const signature = await signDeltaOrder(orderData);
        
        setSwapStatus({ status: 'submitting', message: 'Submitting cross-chain order...' });
        deltaAuction = await postDeltaOrder({
          orderData,
          signature,
        });
      } else {
        // For same-chain swaps, use buildDeltaOrder
        const orderData = await buildDeltaOrder({
          deltaPrice: quoteResponse.delta,
          owner: address!,
          srcToken: params.srcToken.address,
          destToken: params.destToken.address,
          srcAmount: params.amount,
          destAmount: destAmountAfterSlippage,
          beneficiary: params.recipient || address!,
          beneficiaryType: 'EOA',
        });
        
        setSwapStatus({ status: 'submitting', message: 'Signing Delta order...' });
        const signature = await signDeltaOrder(orderData);
        
        setSwapStatus({ status: 'submitting', message: 'Submitting order...' });
        deltaAuction = await postDeltaOrder({
          orderData,
          signature,
        });
      }

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
  }, [getQuote, approveTokenForDelta, buildDeltaOrder, signDeltaOrder, postDeltaOrder, address, provider]);

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
      setSwapStatus({ status: 'loading', message: 'Retrying quote...' });
    }
  }, [lastError]);

  const checkTokenSupport = useCallback(async (tokenAddress: string) => {
    try {
      return await isTokenSupportedInDelta(tokenAddress);
    } catch (error) {
      console.error('Error checking token support:', error);
      return false;
    }
  }, [isTokenSupportedInDelta]);

  const getPartnerFeeInfo = useCallback(async (partner: string) => {
    try {
      return await getPartnerFee(partner);
    } catch (error) {
      console.error('Error getting partner fee:', error);
      return null;
    }
  }, [getPartnerFee]);

  const cancelOrder = useCallback(async () => {
    try {
      setSwapStatus({ status: 'loading', message: 'Cancelling order...' });
      // Note: This would need the signature from the original order
      // For now, we'll just show the status
      setSwapStatus({ status: 'failed', message: 'Order cancellation requires signature' });
    } catch (error) {
      console.error('Error cancelling order:', error);
      setSwapStatus({ status: 'failed', message: 'Failed to cancel order' });
    }
  }, []);

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
    checkTokenSupport,
    getPartnerFeeInfo,
    cancelOrder,
  };
};
