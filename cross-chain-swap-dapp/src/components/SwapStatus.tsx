import React from 'react';
import { CheckCircle, XCircle, Clock, Loader, ArrowRight } from 'lucide-react';
import { SwapStatus as SwapStatusType } from '../types';

interface SwapStatusProps {
  status: SwapStatusType;
}

export const SwapStatus: React.FC<SwapStatusProps> = ({ status }) => {
  const getStatusIcon = () => {
    switch (status.status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'failed':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'loading':
      case 'approving':
      case 'submitting':
      case 'executing':
        return <Loader className="w-6 h-6 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'loading':
      case 'approving':
      case 'submitting':
      case 'executing':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getBridgeStatusBadge = () => {
    if (!status.bridgeStatus) return null;

    const bridgeStatusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      filled: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${bridgeStatusColors[status.bridgeStatus]}`}>
        Bridge: {status.bridgeStatus}
      </span>
    );
  };

  if (status.status === 'idle') {
    return null;
  }

  return (
    <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
      <div className="flex items-center gap-3">
        {getStatusIcon()}
        <div className="flex-1">
          <div className="font-medium">{status.message}</div>
          {status.auctionId && (
            <div className="text-sm opacity-75 mt-1">
              Order ID: {status.auctionId.slice(0, 8)}...{status.auctionId.slice(-8)}
            </div>
          )}
        </div>
        {getBridgeStatusBadge()}
      </div>
      
      {status.status === 'executing' && (
        <div className="mt-3 flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span>Source Chain</span>
          </div>
          <ArrowRight className="w-4 h-4" />
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span>Bridge</span>
          </div>
          <ArrowRight className="w-4 h-4" />
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Destination Chain</span>
          </div>
        </div>
      )}
    </div>
  );
};



