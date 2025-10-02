import { useMemo } from 'react';
import { constructSimpleSDK } from '@velora-dex/sdk';
import { ethers } from 'ethers';
import axios from 'axios';

// Create a custom axios wrapper to ensure isAxiosError is available
const axiosWrapper = {
  ...axios,
  isAxiosError: axios.isAxiosError,
  request: axios.request,
};

// Debug: Check if axios wrapper has the required methods
console.log('Axios wrapper isAxiosError type:', typeof axiosWrapper.isAxiosError);
console.log('Axios wrapper request type:', typeof axiosWrapper.request);

interface UseVeloraSDKProps {
  chainId: number;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  address: string | null;
}

export const useVeloraSDK = ({ chainId, provider, signer, address }: UseVeloraSDKProps) => {
  const sdk = useMemo(() => {
    if (!provider || !signer || !address) {
      return null;
    }

    try {
      return constructSimpleSDK(
        { 
          chainId, 
          axios: axiosWrapper,
          apiURL: 'https://api.paraswap.io' // Velora uses Paraswap API infrastructure
        },
        {
          ethersProviderOrSigner: signer,
          EthersContract: ethers.Contract,
          account: address,
        }
      );
    } catch (error) {
      console.error('Failed to initialize Velora SDK:', error);
      return null;
    }
  }, [chainId, provider, signer, address]);

  const getBridgeInfo = async () => {
    if (!sdk) throw new Error('SDK not initialized');
    try {
      console.log('Getting bridge info...');
      const result = await sdk.delta.getBridgeInfo();
      console.log('Bridge info result:', result);
      return result;
    } catch (error) {
      console.error('Error getting bridge info:', error);
      throw error;
    }
  };

  const getDeltaPrice = async (params: {
    srcToken: string;
    destToken: string;
    destChainId: number;
    amount: string;
    userAddress: string;
    srcDecimals: number;
    destDecimals: number;
  }) => {
    if (!sdk) throw new Error('SDK not initialized');
    try {
      console.log('Getting delta price with params:', params);
      console.log('Current chain ID:', chainId);
      console.log('Destination chain ID:', params.destChainId);
      
      const result = await sdk.delta.getDeltaPrice(params);
      console.log('Delta price result:', result);
      return result;
    } catch (error) {
      console.error('Error getting delta price:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : 'No stack',
        chainId,
        destChainId: params.destChainId,
        srcToken: params.srcToken,
        destToken: params.destToken
      });
      throw error;
    }
  };

  const approveTokenForDelta = async (amount: string, tokenAddress: string) => {
    if (!sdk) throw new Error('SDK not initialized');
    return sdk.delta.approveTokenForDelta(amount, tokenAddress);
  };

  const submitDeltaOrder = async (params: {
    deltaPrice: any;
    owner: string;
    srcToken: string;
    destToken: string;
    srcAmount: string;
    destAmount: string;
    destChainId: number;
    beneficiary?: string;
    beneficiaryType?: 'EOA' | 'CONTRACT';
  }) => {
    if (!sdk) throw new Error('SDK not initialized');
    // Use the correct parameter structure for submitDeltaOrder
    return sdk.delta.submitDeltaOrder({
      deltaPrice: params.deltaPrice,
      owner: params.owner,
      srcToken: params.srcToken,
      destToken: params.destToken,
      srcAmount: params.srcAmount,
      destAmount: params.destAmount,
      destChainId: params.destChainId,
      beneficiary: params.beneficiary,
      beneficiaryType: params.beneficiaryType as any, // Type assertion to bypass type mismatch
    });
  };

  const getDeltaOrderById = async (auctionId: string) => {
    if (!sdk) throw new Error('SDK not initialized');
    return sdk.delta.getDeltaOrderById(auctionId);
  };

  const getQuote = async (params: {
    srcToken: string;
    destToken: string;
    amount: string;
    userAddress: string;
    srcDecimals: number;
    destDecimals: number;
    mode: 'delta' | 'market' | 'all';
  }) => {
    if (!sdk) throw new Error('SDK not initialized');
    return sdk.quote.getQuote(params);
  };

  return {
    sdk,
    getBridgeInfo,
    getDeltaPrice,
    approveTokenForDelta,
    submitDeltaOrder,
    getDeltaOrderById,
    getQuote,
  };
};
