import React from 'react';
import { ArrowRight, Info } from 'lucide-react';
import { QuoteResponse, Token, Chain } from '../types';

interface QuoteDisplayProps {
  quote: QuoteResponse | null;
  srcToken: Token | null;
  destToken: Token | null;
  srcChain: Chain | null;
  destChain: Chain | null;
  amount: string;
  srcAmountInWei?: string;
}

export const QuoteDisplay: React.FC<QuoteDisplayProps> = ({
  quote,
  srcToken,
  destToken,
  srcChain,
  destChain,
  amount,
}) => {
  if (!quote || !srcToken || !destToken) {
    return null;
  }

  const formatAmount = (amount: string, decimals: number) => {
    if (!amount || amount === '0') return '0';
    
    try {
      const num = parseFloat(amount) / Math.pow(10, decimals);
      if (isNaN(num) || !isFinite(num)) return '0';
      return num.toLocaleString(undefined, { maximumFractionDigits: 6 });
    } catch (error) {
      console.error('Error formatting amount:', amount, 'decimals:', decimals, error);
      return '0';
    }
  };

  // Use the raw amount for display (not wei)
  const displayAmount = amount || '0';
  

  // Validate quote values
  const validateQuote = (quote: QuoteResponse) => {
    if (quote.delta) {
      const destAmount = parseFloat(quote.delta.destAmount || '0');

      // Only check if destAmount is 0 or negative
      if (destAmount <= 0) {
        return { isValid: false, warning: 'Invalid quote - destination amount is zero or negative' };
      }
    }
    return { isValid: true };
  };

  const quoteValidation = validateQuote(quote);

  const isCrossChain = srcChain?.id !== destChain?.id;

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Quote Details</h3>
        <div className="flex items-center gap-2">
          {isCrossChain && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              Cross-Chain
            </span>
          )}
          {!quoteValidation.isValid && (
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
              ⚠️ Invalid
            </span>
          )}
        </div>
      </div>

      {!quoteValidation.isValid && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-red-800">Quote Warning</span>
          </div>
          <p className="text-sm text-red-700 mt-1">
            {quoteValidation.warning}
          </p>
        </div>
      )}

      {quote.delta ? (
        <div className="space-y-3">
                 <div className="flex items-center justify-between">
                   <span className="text-sm text-gray-600">You send</span>
                   <span className="font-medium">
                     {displayAmount} {srcToken.symbol}
                   </span>
                 </div>

                 <div className="flex items-center justify-center">
                   <ArrowRight className="w-4 h-4 text-gray-400" />
                 </div>

                 <div className="flex items-center justify-between">
                   <span className="text-sm text-gray-600">You receive</span>
                   <span className="font-medium">
                     {formatAmount(quote.delta.destAmount || '0', destToken.decimals)} {destToken.symbol}
                   </span>
                 </div>

          {isCrossChain && quote.delta.bridgeInfo && (
            <>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700">Bridge Details</span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">After bridge</span>
                    <span>
                      {formatAmount(quote.delta.bridgeInfo.destAmountAfterBridge || quote.delta.destAmount || '0', destToken.decimals)} {destToken.symbol}
                    </span>
                  </div>

                  {quote.delta.bridgeInfo.fees && quote.delta.bridgeInfo.fees.length > 0 && quote.delta.bridgeInfo.fees.map((fee, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-gray-600">Bridge fee</span>
                      <span>
                        {formatAmount(fee.amount || '0', destToken.decimals)} {destToken.symbol}
                        {fee.amountInUSD && (
                          <span className="text-gray-500 ml-1">
                            (${parseFloat(fee.amountInUSD).toFixed(2)})
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-800">Delta Order</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              This is a gasless swap with competitive pricing. Multiple agents will compete to execute your trade at the best price.
            </p>
          </div>
        </div>
      ) : quote.market ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">You send</span>
            <span className="font-medium">
              {displayAmount} {srcToken.symbol}
            </span>
          </div>

          <div className="flex items-center justify-center">
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">You receive</span>
            <span className="font-medium">
              {formatAmount(quote.market.destAmount, destToken.decimals)} {destToken.symbol}
            </span>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-yellow-800">Market Order</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Delta order not available. Using market pricing with immediate execution.
            </p>
          </div>
        </div>
      ) : quote.fallbackReason ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-red-800">Quote Unavailable</span>
          </div>
          <p className="text-sm text-red-700 mt-1">
            {quote.fallbackReason.errorType}: {quote.fallbackReason.details}
          </p>
        </div>
      ) : null}
    </div>
  );
};
