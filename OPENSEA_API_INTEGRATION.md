# OpenSea API Integration for NFT Catalog

This project now includes comprehensive integration with the OpenSea API to provide live market data and event tracking for your NFT collection.

## Features Added

### 1. Live Event Tracking
- **NFT Events**: Track all events (sales, listings, bids, transfers) for individual NFTs
- **Collection Events**: Monitor activity across entire collections
- **Real-time Updates**: Refresh data to get the latest market activity
- **Event Filtering**: Filter by event type and date range

### 2. Market Analytics
- **Price History**: Track price movements over time
- **Volume Analysis**: Monitor trading volume and liquidity
- **Market Statistics**: Total sales, average prices, unique owners
- **Floor Price Tracking**: Monitor collection floor prices

### 3. Enhanced NFT Dashboard
- **Comprehensive View**: Detailed NFT information with live market data
- **Event Timeline**: Chronological view of all NFT activity
- **Market Metrics**: Key performance indicators
- **Direct Links**: Quick access to OpenSea listings

## API Endpoints

### Server Endpoints (server.js)

#### 1. Get NFT Events
```
GET /api/events/:contractAddress/:tokenId
```
**Query Parameters:**
- `event_type`: Filter by event type (created, successful, cancelled, etc.)
- `occurred_after`: ISO timestamp for start date
- `occurred_before`: ISO timestamp for end date
- `cursor`: Pagination cursor

#### 2. Get Collection Events
```
GET /api/collection-events/:contractAddress
```
**Query Parameters:**
- `event_type`: Filter by event type
- `occurred_after`: ISO timestamp for start date
- `occurred_before`: ISO timestamp for end date
- `cursor`: Pagination cursor
- `limit`: Number of events to return (default: 50)

#### 3. Get NFT Asset Details
```
GET /api/price/:contractAddress/:tokenId
```
Returns detailed NFT information including current listings and bids.

## React Components

### 1. OpenSeaEvents Component
```tsx
import { OpenSeaEvents } from './components/OpenSeaEvents';

<OpenSeaEvents
  contractAddress="0x123..."
  tokenId="1234"
  nftTitle="My NFT"
/>
```

**Features:**
- Real-time event fetching
- Event type filtering
- Date range filtering
- Expandable event details
- Price formatting with USD conversion
- Transaction hash links to Etherscan

### 2. NFTDashboard Component
```tsx
import { NFTDashboard } from './components/NFTDashboard';

<NFTDashboard
  nft={nftData}
  onClose={() => setShowDashboard(false)}
/>
```

**Features:**
- Comprehensive NFT information
- Market statistics
- Recent activity timeline
- Price analytics (placeholder for charts)
- Direct OpenSea links

### 3. OpenSea Service
```tsx
import { 
  getNFTEvents, 
  getCollectionEvents, 
  getNFTAsset,
  formatPrice,
  formatAddress,
  formatDate 
} from './services/openseaService';
```

**Service Functions:**
- `getNFTEvents()`: Fetch events for specific NFT
- `getCollectionEvents()`: Fetch events for entire collection
- `getNFTAsset()`: Get detailed NFT information
- `getAllNFTEvents()`: Get all events with pagination
- `getRecentEventsForNFTs()`: Batch fetch recent events

## Event Types

The API tracks these event types:
- `created`: NFT listed for sale
- `successful`: NFT sold
- `cancelled`: Listing cancelled
- `bid_entered`: Bid placed
- `bid_withdrawn`: Bid withdrawn
- `transfer`: NFT transferred
- `approve`: Approval event

## Rate Limiting

The service includes built-in rate limiting:
- **8 requests per minute** to comply with OpenSea API limits
- Automatic request queuing
- Error handling for rate limit exceeded

## Setup Instructions

### 1. Environment Variables
Create a `.env` file in your project root:
```
REACT_APP_OPENSEA_API_KEY=your_opensea_api_key_here
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Development Server
```bash
# Terminal 1: Start the proxy server
npm run start-proxy

# Terminal 2: Start the React app
npm start
```

### 4. API Key Setup
1. Get your OpenSea API key from [OpenSea Developer Portal](https://docs.opensea.io/reference/api-overview)
2. Add it to your `.env` file
3. The proxy server will use this key for all API calls

## Usage Examples

### Fetch Recent Events for an NFT
```tsx
import { getNFTEvents } from './services/openseaService';

const events = await getNFTEvents(
  '0x123...', // contract address
  '1234',     // token ID
  {
    event_type: 'successful',
    occurred_after: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  }
);
```

### Get Collection Activity
```tsx
import { getCollectionEvents } from './services/openseaService';

const collectionEvents = await getCollectionEvents(
  '0x123...', // contract address
  {
    limit: 100,
    event_type: 'successful'
  }
);
```

### Display Events in Component
```tsx
import { OpenSeaEvents } from './components/OpenSeaEvents';

function MyComponent() {
  return (
    <OpenSeaEvents
      contractAddress="0x123..."
      tokenId="1234"
      nftTitle="My NFT"
    />
  );
}
```

## Error Handling

The service includes comprehensive error handling:
- Network errors
- API rate limiting
- Invalid contract addresses
- Missing token IDs
- Authentication errors

## Data Formatting

### Price Formatting
```tsx
import { formatPrice } from './services/openseaService';

const formattedPrice = formatPrice('1000000000000000000', {
  symbol: 'ETH',
  decimals: 18,
  usd_price: 2000
});
// Output: "1.0000 ETH ($2000.00)"
```

### Address Formatting
```tsx
import { formatAddress } from './services/openseaService';

const shortAddress = formatAddress('0x1234567890abcdef...');
// Output: "0x1234...cdef"
```

## Performance Considerations

1. **Rate Limiting**: Built-in rate limiting prevents API quota exhaustion
2. **Caching**: Consider implementing caching for frequently accessed data
3. **Pagination**: Use cursors for large datasets
4. **Error Recovery**: Automatic retry logic for failed requests

## Troubleshooting

### Common Issues

1. **API Key Errors**
   - Ensure your OpenSea API key is valid
   - Check that the key has the necessary permissions

2. **Rate Limiting**
   - The service automatically handles rate limiting
   - If you see rate limit errors, the service will retry automatically

3. **Network Errors**
   - Check your internet connection
   - Verify the proxy server is running

4. **Missing Data**
   - Some NFTs may not have recent events
   - Check that contract addresses and token IDs are correct

### Debug Mode

Enable debug logging by adding to your `.env`:
```
REACT_APP_DEBUG=true
```

This will log all API requests and responses to the console.

## Future Enhancements

1. **WebSocket Integration**: Real-time event streaming
2. **Price Charts**: Interactive price history charts
3. **Alert System**: Price and activity notifications
4. **Portfolio Tracking**: Multi-NFT portfolio management
5. **Advanced Analytics**: Machine learning price predictions

## Support

For issues or questions:
1. Check the OpenSea API documentation
2. Review the error messages in the browser console
3. Verify your API key permissions
4. Test with the OpenSea API directly to confirm endpoints work 