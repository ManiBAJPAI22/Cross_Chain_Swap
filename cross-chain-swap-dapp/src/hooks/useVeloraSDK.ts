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
          apiURL: '/api' // Use Vite proxy for CORS-free development
        },
        {
          ethersV6ProviderOrSigner: signer,
          EthersV6Contract: ethers.Contract,
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
    return sdk.delta.getBridgeInfo();
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
    return sdk.delta.getDeltaPrice(params);
  };

  const approveTokenForDelta = async (amount: string, tokenAddress: string) => {
    if (!sdk) throw new Error('SDK not initialized');
    return sdk.delta.approveTokenForDelta(amount, tokenAddress);
  };

  const buildDeltaOrder = async (params: {
    deltaPrice: any;
    owner: string;
    srcToken: string;
    destToken: string;
    srcAmount: string;
    destAmount: string;
    destChainId?: number;
    beneficiary?: string;
    beneficiaryType?: 'EOA' | 'SmartContract';
  }) => {
    if (!sdk) throw new Error('SDK not initialized');
    return sdk.delta.buildDeltaOrder({
      deltaPrice: params.deltaPrice,
      owner: params.owner,
      srcToken: params.srcToken,
      destToken: params.destToken,
      srcAmount: params.srcAmount,
      destAmount: params.destAmount,
      destChainId: params.destChainId,
      beneficiary: params.beneficiary,
      beneficiaryType: params.beneficiaryType || 'EOA',
    });
  };

  const signDeltaOrder = async (orderData: any) => {
    if (!sdk) throw new Error('SDK not initialized');
    return sdk.delta.signDeltaOrder(orderData);
  };

  const postDeltaOrder = async (params: {
    orderData: any;
    signature: string;
  }) => {
    if (!sdk) throw new Error('SDK not initialized');
    return sdk.delta.postDeltaOrder({
      ...params.orderData,
      signature: params.signature,
    });
  };


  const getPartnerFee = async (partner: string) => {
    if (!sdk) throw new Error('SDK not initialized');
    return sdk.delta.getPartnerFee({ partner });
  };

  const isTokenSupportedInDelta = async (tokenAddress: string) => {
    if (!sdk) throw new Error('SDK not initialized');
    return sdk.delta.isTokenSupportedInDelta(tokenAddress);
  };

  const cancelDeltaOrder = async () => {
    if (!sdk) throw new Error('SDK not initialized');
    // Note: cancelDeltaOrder might not be available in the current SDK version
    // We'll implement a placeholder for now
    throw new Error('Order cancellation not implemented in current SDK version');
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
    buildDeltaOrder,
    signDeltaOrder,
    postDeltaOrder,
    getPartnerFee,
    isTokenSupportedInDelta,
    cancelDeltaOrder,
    getDeltaOrderById,
    getQuote,
  };
};
