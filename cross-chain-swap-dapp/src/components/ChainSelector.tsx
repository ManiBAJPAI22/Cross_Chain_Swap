import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Chain } from '../types';
import { SUPPORTED_CHAINS } from '../constants/chains';

interface ChainSelectorProps {
  selectedChain: Chain | null;
  onChainSelect: (chain: Chain) => void;
  disabled?: boolean;
  label: string;
}

export const ChainSelector: React.FC<ChainSelectorProps> = ({
  selectedChain,
  onChainSelect,
  disabled = false,
  label,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-3">
          {selectedChain && (
            <>
              <img
                src={selectedChain.logoURI}
                alt={selectedChain.name}
                className="w-6 h-6 rounded-full"
              />
              <span className="font-medium">{selectedChain.name}</span>
            </>
          )}
          {!selectedChain && (
            <span className="text-gray-500">Select chain</span>
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="py-1">
            {SUPPORTED_CHAINS.map((chain) => (
              <button
                key={chain.id}
                onClick={() => {
                  onChainSelect(chain);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left"
              >
                <img
                  src={chain.logoURI}
                  alt={chain.name}
                  className="w-6 h-6 rounded-full"
                />
                <div>
                  <div className="font-medium">{chain.name}</div>
                  <div className="text-sm text-gray-500">{chain.symbol}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};




