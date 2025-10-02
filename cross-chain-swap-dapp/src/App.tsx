import { useState } from 'react';
import { WalletButton } from './components/WalletButton';
import { SwapInterface } from './components/SwapInterface';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useWallet } from './hooks/useWallet';

function App() {
  const { isConnected, address, chainId } = useWallet();
  const [forceShowSwap, setForceShowSwap] = useState(false);
  
  // Debug logging
  console.log('App render - isConnected:', isConnected, 'address:', address, 'chainId:', chainId, 'forceShowSwap:', forceShowSwap);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">
                  Velora Cross-Chain Swap
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <WalletButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Swap Tokens Across Chains
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Experience gasless cross-chain swaps with competitive pricing using Velora's Delta protocol.
            Trade between Ethereum, Optimism, Polygon, and Arbitrum seamlessly.
          </p>
        </div>

        {!isConnected && !forceShowSwap ? (
          <div className="max-w-md mx-auto">
            <div className="card text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Connect Your Wallet
                </h3>
                <p className="text-gray-600">
                  Connect your wallet to start swapping tokens across different chains.
                </p>
              </div>
              <WalletButton />
              
              {/* Temporary debug button */}
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 mb-2">Debug: Force show swap interface</p>
                <button 
                  onClick={() => {
                    console.log('Force showing swap interface');
                    setForceShowSwap(true);
                  }}
                  className="btn-secondary text-xs"
                >
                  Show Swap Interface (Debug)
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {isConnected && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✅ Wallet Connected: {address} (Chain: {chainId})
                </p>
              </div>
            )}
            {forceShowSwap && !isConnected && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Debug Mode: Showing swap interface without wallet connection
                </p>
                <button 
                  onClick={() => setForceShowSwap(false)}
                  className="btn-secondary text-xs mt-2"
                >
                  Hide Swap Interface
                </button>
              </div>
            )}
            <ErrorBoundary>
              <SwapInterface />
            </ErrorBoundary>
          </div>
        )}

        {/* Features Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Gasless Swaps</h3>
            <p className="text-gray-600">
              Execute cross-chain swaps without paying gas fees on the source chain.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Best Prices</h3>
            <p className="text-gray-600">
              Multiple agents compete to execute your trade at the most competitive price.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cross-Chain</h3>
            <p className="text-gray-600">
              Seamlessly swap tokens between Ethereum, Optimism, Polygon, and Arbitrum.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p className="mb-2">
              Powered by <a href="https://velora.xyz" className="text-blue-600 hover:text-blue-800 font-medium">Velora</a> SDK
            </p>
            <p className="text-sm">
              Built with React, TypeScript, and Tailwind CSS
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
