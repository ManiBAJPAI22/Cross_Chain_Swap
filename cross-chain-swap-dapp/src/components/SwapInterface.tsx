import React, { useState, useEffect } from 'react';
import { ArrowUpDown, Settings, RefreshCw } from 'lucide-react';
import { Chain, Token, SwapParams } from '../types';
import { SUPPORTED_CHAINS } from '../constants/chains';
import { getTokensByChain } from '../constants/tokens';
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

  const {
    swapStatus,
    quote,
    loadBridgeInfo,
    getQuote,
    executeSwap,
    monitorSwap,
    resetSwap,
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
    if (srcChain) {
      const tokens = getTokensByChain(srcChain.id);
      if (tokens.length > 0 && !srcToken) {
        setSrcToken(tokens[0]);
      }
    }
  }, [srcChain, srcToken]);

  useEffect(() => {
    if (destChain) {
      const tokens = getTokensByChain(destChain.id);
      if (tokens.length > 0 && !destToken) {
        setDestToken(tokens[0]);
      }
    }
  }, [destChain, destToken]);

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

  const handleGetQuote = async () => {
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

    try {
      await getQuote(swapParams);
    } catch (error) {
      console.error('Failed to get quote:', error);
    }
  };

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

  const canExecuteSwap = isConnected && srcToken && destToken && srcChain && destChain && amount && quote;

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
                <TokenSelector
                  selectedToken={srcToken}
                  onTokenSelect={setSrcToken}
                  chainId={srcChain?.id || null}
                  label="Token"
                />
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
            <TokenSelector
              selectedToken={destToken}
              onTokenSelect={setDestToken}
              chainId={destChain?.id || null}
              label="Token"
            />
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
            {!quote ? (
              <button
                onClick={handleGetQuote}
                disabled={!srcToken || !destToken || !srcChain || !destChain || !amount || !isConnected}
                className="btn-primary w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Get Quote
              </button>
            ) : (
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
            )}

            {quote && (
              <button
                onClick={resetSwap}
                className="btn-secondary w-full"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
