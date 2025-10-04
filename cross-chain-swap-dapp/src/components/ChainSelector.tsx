import React, { useState, useMemo } from 'react';
import { Chain } from '../types';
import { ChainService } from '../services/chainService';

interface ChainSelectorProps {
  selectedChain: Chain | null;
  onChainSelect: (chain: Chain) => void;
  label: string;
  disabled?: boolean;
  className?: string;
  showSearch?: boolean;
  showPopular?: boolean;
}

export const ChainSelector: React.FC<ChainSelectorProps> = ({
  selectedChain,
  onChainSelect,
  label,
  disabled = false,
  className = '',
  showSearch = true,
  showPopular = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const allChains = useMemo(() => ChainService.getAllChains(), []);
  const popularChains = useMemo(() => ChainService.getPopularChains(), []);

  const filteredChains = useMemo(() => {
    if (!searchQuery.trim()) {
      return showPopular ? popularChains : allChains;
    }
    return ChainService.searchChains(searchQuery);
  }, [searchQuery, showPopular, popularChains, allChains]);

  const handleChainSelect = (chain: Chain) => {
    onChainSelect(chain);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`
          w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg shadow-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
          ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {selectedChain ? (
              <>
                <img
                  src={ChainService.getChainLogoUrl(selectedChain)}
                  alt={selectedChain.name}
                  className="w-6 h-6 rounded-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/24x24?text=?';
                  }}
                />
                <div>
                  <div className="font-medium text-gray-900">
                    {selectedChain.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {selectedChain.symbol}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-gray-500">
                Select a chain
              </div>
            )}
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {showSearch && (
            <div className="p-3 border-b border-gray-200">
              <input
                type="text"
                placeholder="Search chains..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>
          )}

          <div className="max-h-60 overflow-y-auto">
            {filteredChains.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No chains found
              </div>
            ) : (
              filteredChains.map((chain) => (
                <button
                  key={chain.id}
                  type="button"
                  onClick={() => handleChainSelect(chain)}
                  className={`
                    w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50
                    flex items-center space-x-3
                    ${selectedChain?.id === chain.id ? 'bg-blue-50' : ''}
                  `}
                >
                  <img
                    src={ChainService.getChainLogoUrl(chain)}
                    alt={chain.name}
                    className="w-6 h-6 rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/24x24?text=?';
                    }}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {chain.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {chain.symbol}
                    </div>
                  </div>
                  {selectedChain?.id === chain.id && (
                    <svg
                      className="w-5 h-5 text-blue-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>

          {showPopular && !searchQuery && (
            <div className="border-t border-gray-200 p-3">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Popular Chains
              </div>
              <div className="flex flex-wrap gap-2">
                {popularChains.slice(0, 4).map((chain) => (
                  <button
                    key={chain.id}
                    type="button"
                    onClick={() => handleChainSelect(chain)}
                    className="flex items-center space-x-2 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <img
                      src={ChainService.getChainLogoUrl(chain)}
                      alt={chain.name}
                      className="w-4 h-4 rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/16x16?text=?';
                      }}
                    />
                    <span>{chain.symbol}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};