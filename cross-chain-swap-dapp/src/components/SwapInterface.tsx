import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowUpDown, Settings, RefreshCw } from 'lucide-react';
import { Chain, Token, SwapParams } from '../types';
import { SUPPORTED_CHAINS } from '../constants/chains';
import { useTokens } from '../hooks/useTokens';
import { ChainSelector } from './ChainSelector';
import { TokenSelector } from './TokenSelector';
import { SwapStatus } from './SwapStatus';
import { QuoteDisplay } from './QuoteDisplay';
import { useCrossChainSwap } from '../hooks/useCrossChainSwap';
import { useWallet } from '../hooks/useWallet';

export const SwapInterface: React.FC = () => {
  const { isConnected, chainId, switchChain, provider, signer, address } = useWallet();
  
  // Debug logging
  console.log('SwapInterface render - isConnected:', isConnected, 'address:', address, 'chainId:', chainId);
  
  // Test network connectivity
  const [networkStatus, setNetworkStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  
  useEffect(() => {
    const checkNetwork = async () => {
      try {
        // Try multiple endpoints to check connectivity
        const endpoints = [
          'https://api.paraswap.io/delta/prices/bridge-info',
          'https://api.paraswap.io/prices',
          'https://api.paraswap.io/'
        ];
        
        let isOnline = false;
        for (const endpoint of endpoints) {
          try {
            const response = await fetch(endpoint, {
              method: 'GET',
              mode: 'cors',
              headers: {
                'Accept': 'application/json',
              }
            });
            if (response.ok) {
              console.log('API endpoint accessible:', endpoint);
              isOnline = true;
              break;
            }
          } catch (err) {
            console.warn('Failed to reach endpoint:', endpoint, err);
          }
        }
        
        setNetworkStatus(isOnline ? 'online' : 'offline');
      } catch (error) {
        console.warn('Network check failed:', error);
        setNetworkStatus('offline');
      }
    };
    
    checkNetwork();
  }, []);
  
  // State
  const [srcChain, setSrcChain] = useState<Chain | null>(SUPPORTED_CHAINS[0]);
  const [destChain, setDestChain] = useState<Chain | null>(SUPPORTED_CHAINS[1]);
  const [srcToken, setSrcToken] = useState<Token | null>(null);
  const [destToken, setDestToken] = useState<Token | null>(null);
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [recipient, setRecipient] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  
  // Refs for debouncing
  const quoteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastParamsRef = useRef<string>('');

  // Load tokens for the current chain
  const {
    sourceTokens: srcChainTokens,
    destTokens: destChainTokens,
    isLoading: isLoadingTokens,
    error: tokenError,
    isNativeToken,
  } = useTokens({ chainId: chainId || 1 });

  const {
    swapStatus,
    quote,
    retryCount,
    lastError,
    loadBridgeInfo,
    getQuote,
    executeSwap,
    monitorSwap,
    resetSwap,
    retryQuote,
  } = useCrossChainSwap({
    chainId: chainId || 1,
    provider,
    signer,
    address,
  });

  // Load bridge info on mount
  useEffect(() => {
    loadBridgeInfo();
  }, [loadBridgeInfo]);

  // Auto-select first token when chain changes
  useEffect(() => {
    if (srcChain && srcChainTokens.length > 0) {
      // Only auto-select if no token is selected or if current token is not available on new chain
      const currentTokenAvailable = srcToken && srcChainTokens.some(t => t.address === srcToken.address);
      if (!srcToken || !currentTokenAvailable || isNativeToken(srcToken)) {
        setSrcToken(srcChainTokens[0]);
      }
    } else if (srcChain && srcChainTokens.length === 0) {
      // Clear token if no tokens available for the chain
      setSrcToken(null);
    }
  }, [srcChain, srcChainTokens, srcToken, isNativeToken]);

  useEffect(() => {
    if (destChain && destChainTokens.length > 0) {
      // Only auto-select if no token is selected or if current token is not available on new chain
      const currentTokenAvailable = destToken && destChainTokens.some(t => t.address === destToken.address);
      if (!destToken || !currentTokenAvailable) {
        setDestToken(destChainTokens[0]);
      }
    } else if (destChain && destChainTokens.length === 0) {
      // Clear token if no tokens available for the chain
      setDestToken(null);
    }
  }, [destChain, destChainTokens, destToken]);

  // Switch to source chain when needed
  useEffect(() => {
    if (isConnected && srcChain && chainId !== srcChain.id) {
      switchChain(srcChain.id);
    }
  }, [isConnected, srcChain, chainId, switchChain]);

  const handleSwapChains = () => {
    const tempChain = srcChain;
    const tempToken = srcToken;
    setSrcChain(destChain);
    setDestChain(tempChain);
    setSrcToken(destToken);
    setDestToken(tempToken);
  };

  // Debounced quote fetching
  const debouncedGetQuote = useCallback(async (swapParams: SwapParams) => {
    const paramsKey = JSON.stringify({
      srcToken: swapParams.srcToken.address,
      destToken: swapParams.destToken.address,
      srcChain: swapParams.srcChain.id,
      destChain: swapParams.destChain.id,
      amount: swapParams.amount,
    });

    // Skip if same params
    if (lastParamsRef.current === paramsKey) {
      return;
    }

    lastParamsRef.current = paramsKey;
    setIsLoadingQuote(true);

    try {
      await getQuote(swapParams);
    } catch (error) {
      console.error('Failed to get quote:', error);
    } finally {
      setIsLoadingQuote(false);
    }
  }, [getQuote]);

  const handleGetQuote = useCallback(async () => {
    if (!srcToken || !destToken || !srcChain || !destChain || !amount) {
      console.log('Missing required fields for quote:', { srcToken, destToken, srcChain, destChain, amount });
      return;
    }

    const swapParams: SwapParams = {
      srcToken,
      destToken,
      srcChain,
      destChain,
      amount: (parseFloat(amount) * Math.pow(10, srcToken.decimals)).toString(),
      slippage,
      recipient: recipient || undefined,
    };

    console.log('Getting quote with params:', swapParams);

    // Clear existing timeout
    if (quoteTimeoutRef.current) {
      clearTimeout(quoteTimeoutRef.current);
    }

    // Debounce quote requests by 500ms
    quoteTimeoutRef.current = setTimeout(() => {
      debouncedGetQuote(swapParams);
    }, 500);
  }, [srcToken, destToken, srcChain, destChain, amount, slippage, recipient, debouncedGetQuote]);

  // Auto-fetch quote when parameters change
  useEffect(() => {
    if (srcToken && destToken && srcChain && destChain && amount && parseFloat(amount) > 0) {
      handleGetQuote();
    }
  }, [srcToken, destToken, srcChain, destChain, amount, handleGetQuote]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (quoteTimeoutRef.current) {
        clearTimeout(quoteTimeoutRef.current);
      }
    };
  }, []);

  const handleExecuteSwap = async () => {
    if (!srcToken || !destToken || !srcChain || !destChain || !amount) {
      return;
    }

    const swapParams: SwapParams = {
      srcToken,
      destToken,
      srcChain,
      destChain,
      amount: (parseFloat(amount) * Math.pow(10, srcToken.decimals)).toString(),
      slippage,
      recipient: recipient || undefined,
    };

    try {
      const deltaAuction = await executeSwap(swapParams);
      
      // Start monitoring if we have an auction ID
      if (deltaAuction?.id) {
        const monitorInterval = setInterval(async () => {
          const isComplete = await monitorSwap(deltaAuction.id);
          if (isComplete) {
            clearInterval(monitorInterval);
          }
        }, 3000);

        // Stop monitoring after 5 minutes
        setTimeout(() => clearInterval(monitorInterval), 300000);
      }
    } catch (error) {
      console.error('Failed to execute swap:', error);
    }
  };

  // Check if current selection is valid for Delta protocol
  const isNativeSourceToken = srcToken && isNativeToken(srcToken);
  const isValidSelection = srcToken && destToken && srcChain && destChain && amount && !isNativeSourceToken && !isLoadingTokens;
  const canExecuteSwap = isConnected && isValidSelection && quote;

  return (
    <div className="max-w-md mx-auto">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Cross-Chain Swap</h1>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {showSettings && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slippage Tolerance (%)
              </label>
              <input
                type="number"
                value={slippage}
                onChange={(e) => setSlippage(parseFloat(e.target.value) || 0)}
                className="input-field"
                min="0"
                max="50"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Address (Optional)
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Leave empty to use your address"
                className="input-field"
              />
            </div>
          </div>
        )}

        {/* Network Status */}
        <div className="mb-4">
          {networkStatus === 'checking' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">🔄 Checking network connectivity...</p>
            </div>
          )}
          {networkStatus === 'online' && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">✅ Network online - API accessible</p>
            </div>
          )}
                 {networkStatus === 'offline' && (
                   <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                     <p className="text-sm text-red-800">❌ Network offline - API not accessible</p>
                     <div className="space-y-2">
                       <button
                        onClick={async () => {
                          setNetworkStatus('checking');
                          try {
                            const response = await fetch('https://api.paraswap.io/delta/prices/bridge-info', {
                              method: 'GET',
                              mode: 'cors',
                              headers: {
                                'Accept': 'application/json',
                              }
                            });
                            console.log('Direct API test response:', response.status, response.statusText);
                            if (response.ok) {
                              setNetworkStatus('online');
                            } else {
                              setNetworkStatus('offline');
                            }
                          } catch (error) {
                            console.error('Direct API test failed:', error);
                            setNetworkStatus('offline');
                          }
                        }}
                         className="btn-secondary text-xs"
                       >
                         Retry API Connection
                       </button>
                       <div className="text-xs text-gray-600">
                         <p>If this persists, try:</p>
                         <ul className="list-disc list-inside mt-1 space-y-1">
                           <li>Disable ad blockers</li>
                           <li>Check browser console for CORS errors</li>
                           <li>Try a different network</li>
                         </ul>
                       </div>
                     </div>
                   </div>
                 )}
        </div>

        {/* Token Loading State */}
        {isLoadingTokens && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
              <span className="text-sm font-medium text-blue-800">Loading tokens...</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              Fetching the latest token list from Velora API...
            </p>
          </div>
        )}

        {/* Token Loading Error */}
        {tokenError && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-sm font-medium text-yellow-800">Token Loading Warning</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              {tokenError}. Using fallback token list.
            </p>
          </div>
        )}

        {/* Native Token Warning */}
        {isNativeSourceToken && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-sm font-medium text-red-800">Delta Protocol Limitation</span>
            </div>
            <p className="text-sm text-red-700 mt-1">
              Native tokens (ETH, MATIC) cannot be used as source tokens in Delta protocol. Please select a different token like USDC, USDT, or DAI.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {/* Source Chain & Token */}
          <div className="space-y-3">
            <ChainSelector
              selectedChain={srcChain}
              onChainSelect={setSrcChain}
              label="From Chain"
            />
            <div className="flex gap-2">
              <div className="flex-1">
                {isLoadingTokens ? (
                  <div className="flex items-center justify-center p-3 border border-gray-300 rounded-lg bg-gray-50">
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    <span className="text-sm text-gray-600">Loading tokens...</span>
                  </div>
                ) : tokenError ? (
                  <div className="p-3 border border-red-200 rounded-lg bg-red-50">
                    <p className="text-sm text-red-600">Failed to load tokens: {tokenError}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <TokenSelector
                    selectedToken={srcToken}
                    onTokenSelect={setSrcToken}
                    chainId={srcChain?.id || null}
                    label="Token"
                    tokens={srcChainTokens}
                    disabled={isLoadingTokens}
                  />
                )}
              </div>
              <div className="w-24">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  className="input-field"
                  min="0"
                  step="0.000001"
                />
              </div>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <button
              onClick={handleSwapChains}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <ArrowUpDown className="w-5 h-5" />
            </button>
          </div>

          {/* Destination Chain & Token */}
          <div className="space-y-3">
            <ChainSelector
              selectedChain={destChain}
              onChainSelect={setDestChain}
              label="To Chain"
            />
            {isLoadingTokens ? (
              <div className="flex items-center justify-center p-3 border border-gray-300 rounded-lg bg-gray-50">
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                <span className="text-sm text-gray-600">Loading tokens...</span>
              </div>
            ) : tokenError ? (
              <div className="p-3 border border-red-200 rounded-lg bg-red-50">
                <p className="text-sm text-red-600">Failed to load tokens: {tokenError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                >
                  Retry
                </button>
              </div>
            ) : (
              <TokenSelector
                selectedToken={destToken}
                onTokenSelect={setDestToken}
                chainId={destChain?.id || null}
                label="Token"
                tokens={destChainTokens}
                disabled={isLoadingTokens}
              />
            )}
          </div>

          {/* Quote Display */}
          {quote && (
            <QuoteDisplay
              quote={quote}
              srcToken={srcToken}
              destToken={destToken}
              srcChain={srcChain}
              destChain={destChain}
              amount={amount}
              srcAmountInWei={srcToken ? (parseFloat(amount || '0') * Math.pow(10, srcToken.decimals)).toString() : '0'}
            />
          )}

          {/* Swap Status */}
          <SwapStatus status={swapStatus} />

          {/* Action Buttons */}
          <div className="space-y-2">
            {!quote && !isLoadingQuote ? (
              <button
                onClick={handleGetQuote}
                disabled={!isValidSelection || !isConnected}
                className="btn-primary w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Get Quote
              </button>
            ) : isLoadingQuote ? (
              <button
                disabled
                className="btn-primary w-full opacity-50"
              >
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Getting Quote...
              </button>
            ) : quote ? (
              <button
                onClick={handleExecuteSwap}
                disabled={!canExecuteSwap || swapStatus.status === 'loading' || swapStatus.status === 'approving' || swapStatus.status === 'submitting' || swapStatus.status === 'executing'}
                className="btn-primary w-full"
              >
                {swapStatus.status === 'loading' || swapStatus.status === 'approving' || swapStatus.status === 'submitting' || swapStatus.status === 'executing' ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    {swapStatus.message}
                  </>
                ) : (
                  'Execute Swap'
                )}
              </button>
            ) : null}

            {quote && (
              <button
                onClick={resetSwap}
                className="btn-secondary w-full"
              >
                Reset
              </button>
            )}

            {lastError && !quote && (
              <button
                onClick={() => {
                  retryQuote();
                  handleGetQuote();
                }}
                className="btn-primary w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Quote {retryCount > 0 && `(${retryCount} attempts)`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
