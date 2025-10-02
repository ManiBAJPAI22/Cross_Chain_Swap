# Velora Cross-Chain Swap DApp

A modern, full-featured cross-chain swap application built with the Velora SDK. This DApp enables users to swap tokens across different blockchain networks (Ethereum, Optimism, Polygon, Arbitrum) using Velora's Delta protocol for gasless, competitive-priced swaps.

## Features

- 🌉 **Cross-Chain Swaps**: Swap tokens between Ethereum, Optimism, Polygon, and Arbitrum
- ⛽ **Gasless Execution**: No gas fees on the source chain (except token approval)
- 💰 **Competitive Pricing**: Multiple agents compete for the best execution price
- 🔄 **Real-time Monitoring**: Track swap status and bridge execution in real-time
- 🎨 **Modern UI**: Beautiful, responsive interface built with React and Tailwind CSS
- 🔒 **Wallet Integration**: Seamless MetaMask integration with chain switching
- 📱 **Mobile Friendly**: Fully responsive design for all devices

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Web3**: Ethers.js v6
- **SDK**: Velora SDK v9.0.0
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- MetaMask wallet

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cross-chain-swap-dapp
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
# or
yarn build
```

## Usage

1. **Connect Wallet**: Click "Connect Wallet" to connect your MetaMask wallet
2. **Select Chains**: Choose source and destination chains from the dropdowns
3. **Select Tokens**: Pick the tokens you want to swap
4. **Enter Amount**: Input the amount you want to swap
5. **Get Quote**: Click "Get Quote" to see pricing and bridge details
6. **Execute Swap**: Click "Execute Swap" to submit your cross-chain order
7. **Monitor Progress**: Watch the real-time status of your swap execution

## Supported Chains & Tokens

### Chains
- Ethereum (Mainnet)
- Optimism
- Polygon
- Arbitrum

### Popular Tokens
- ETH/MATIC (native tokens)
- USDC (USD Coin)
- USDT (Tether USD)
- DAI (Dai Stablecoin)

## How It Works

### Delta Protocol
The app uses Velora's Delta protocol, which is an intent-based system that enables:

1. **Gasless Swaps**: Users only pay for token approval, not the swap itself
2. **Competitive Pricing**: Multiple agents compete to execute trades at the best price
3. **Cross-Chain Execution**: Automatic bridging between different blockchain networks

### Swap Flow
1. User selects source and destination chains/tokens
2. System fetches pricing from Velora API
3. User approves source token for Delta contract
4. User signs and submits Delta order
5. Agents compete to execute the trade
6. Bridge handles cross-chain transfer
7. User receives tokens on destination chain

## Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
VITE_RPC_URL_ETHEREUM=https://eth.llamarpc.com
VITE_RPC_URL_OPTIMISM=https://mainnet.optimism.io
VITE_RPC_URL_POLYGON=https://polygon-rpc.com
VITE_RPC_URL_ARBITRUM=https://arb1.arbitrum.io/rpc
```

### Custom RPC URLs
You can modify the RPC URLs in `src/constants/chains.ts` to use your preferred providers.

## Development

### Project Structure
```
src/
├── components/          # React components
│   ├── ChainSelector.tsx
│   ├── TokenSelector.tsx
│   ├── SwapInterface.tsx
│   ├── SwapStatus.tsx
│   ├── QuoteDisplay.tsx
│   └── WalletButton.tsx
├── hooks/              # Custom React hooks
│   ├── useWallet.ts
│   ├── useVeloraSDK.ts
│   └── useCrossChainSwap.ts
├── constants/          # Constants and configuration
│   ├── chains.ts
│   └── tokens.ts
├── types/              # TypeScript type definitions
│   └── index.ts
└── App.tsx            # Main application component
```

### Adding New Chains
1. Add chain configuration to `src/constants/chains.ts`
2. Add supported tokens to `src/constants/tokens.ts`
3. Update the chain selector component if needed

### Adding New Tokens
1. Add token configuration to `src/constants/tokens.ts`
2. Ensure the token is supported by the Velora API

## Troubleshooting

### Common Issues

1. **"MetaMask is not installed"**
   - Install MetaMask browser extension
   - Refresh the page

2. **"Failed to switch chain"**
   - Manually switch to the correct chain in MetaMask
   - Ensure the chain is added to MetaMask

3. **"Quote not available"**
   - Check if the token pair is supported
   - Verify the amount is valid
   - Try a different token pair

4. **"Bridge failed"**
   - Check bridge status in the UI
   - Wait for bridge completion
   - Contact support if issue persists

### Debug Mode
Enable debug logging by opening browser console and looking for detailed error messages.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- Documentation: [Velora Docs](https://developers.velora.xyz/)
- GitHub Issues: [Report Issues](https://github.com/VeloraDEX/paraswap-sdk/issues)
- Discord: [Velora Community](https://discord.gg/velora)

## Acknowledgments

- Built with [Velora SDK](https://github.com/VeloraDEX/paraswap-sdk)
- Powered by [Across Protocol](https://across.to/) for cross-chain bridging
- Icons by [Lucide](https://lucide.dev/)



