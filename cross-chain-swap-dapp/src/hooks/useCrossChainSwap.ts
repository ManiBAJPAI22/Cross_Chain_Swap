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

  const getQuote = useCallback(async (params: SwapParams) => {
    try {
      setSwapStatus({ status: 'loading', message: 'Getting quote...' });
      
      const quoteParams = {
        srcToken: params.srcToken.address,
        destToken: params.destToken.address,
        destChainId: params.destChain.id,
        amount: params.amount,
        userAddress: address!,
        srcDecimals: params.srcToken.decimals,
        destDecimals: params.destToken.decimals,
      };

      console.log('Attempting to get quote with params:', quoteParams);

      const quoteResponse = await getDeltaPrice(quoteParams);
      console.log('Raw API response from getDeltaPrice:', JSON.stringify(quoteResponse, null, 2));
      
      // Handle different possible response structures
      let destAmount = '0';
      let bridgeFee = '0';
      let bridgeInfo = {
        destAmountAfterBridge: '0',
        fees: [] as Array<{ amount: string; amountInUSD: string; }>
      };

      // Check if response has destAmount directly
      if (quoteResponse.destAmount) {
        destAmount = quoteResponse.destAmount;
      } else if (quoteResponse.delta?.destAmount) {
        destAmount = quoteResponse.delta.destAmount;
      }

      // Check for bridge info and fees
      if (quoteResponse.bridgeInfo) {
        bridgeInfo = {
          destAmountAfterBridge: quoteResponse.bridgeInfo.destAmountAfterBridge || destAmount,
          fees: quoteResponse.bridgeInfo.fees || []
        };
        bridgeFee = bridgeInfo.fees[0]?.amount || '0';
      } else if (quoteResponse.delta?.bridgeInfo) {
        bridgeInfo = {
          destAmountAfterBridge: quoteResponse.delta.bridgeInfo.destAmountAfterBridge || destAmount,
          fees: quoteResponse.delta.bridgeInfo.fees || []
        };
        bridgeFee = bridgeInfo.fees[0]?.amount || '0';
      }

      // Convert BridgePrice to QuoteResponse format
      const formattedQuote: QuoteResponse = {
        delta: {
          destAmount,
          bridgeFee,
          bridgeInfo
        }
      };
      
      console.log('Formatted quote:', JSON.stringify(formattedQuote, null, 2));
      setQuote(formattedQuote);
      setSwapStatus({ status: 'idle', message: '' });
      return formattedQuote;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get quote';
      setSwapStatus({ status: 'failed', message: errorMessage });
      throw error;
    }
  }, [getDeltaPrice, address]);

  const executeSwap = useCallback(async (params: SwapParams) => {
    try {
      setSwapStatus({ status: 'loading', message: 'Preparing swap...' });

      // Get quote first
      const quoteResponse = await getQuote(params);
      
      if (!quoteResponse.delta) {
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
      const destAmountAfterSlippage = Math.floor(
        parseFloat(quoteResponse.delta.destAmount) * slippageMultiplier
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
  }, []);

  return {
    swapStatus,
    quote,
    bridgeInfo,
    loadBridgeInfo,
    getQuote,
    executeSwap,
    monitorSwap,
    resetSwap,
  };
};
