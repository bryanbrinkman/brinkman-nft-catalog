// OpenSea API Service
export interface OpenSeaEvent {
  event_type: string;
  event_timestamp: string;
  auction_type?: string;
  ending_price?: string;
  starting_price?: string;
  payment_token?: {
    symbol: string;
    decimals: number;
    usd_price?: number;
  };
  seller?: {
    address: string;
    profile_img_url?: string;
  };
  winner_account?: {
    address: string;
    profile_img_url?: string;
  };
  transaction?: {
    hash: string;
    block_hash: string;
    block_number: number;
  };
  asset?: {
    token_id: string;
    name?: string;
    image_url?: string;
  };
}

export interface OpenSeaEventsResponse {
  asset_events: OpenSeaEvent[];
  next_cursor?: string;
  previous_cursor?: string;
}

export interface OpenSeaAsset {
  id: number;
  token_id: string;
  name: string;
  description: string;
  image_url: string;
  image_preview_url: string;
  image_thumbnail_url: string;
  image_original_url: string;
  animation_url: string;
  animation_original_url: string;
  background_color: string;
  external_link: string;
  asset_contract: {
    address: string;
    asset_contract_type: string;
    created_date: string;
    name: string;
    nft_version: string;
    schema_name: string;
    symbol: string;
    description: string;
    external_link: string;
    image_url: string;
    default_to_fiat: boolean;
    dev_buyer_fee_basis_points: number;
    dev_seller_fee_basis_points: number;
    only_proxied_transfers: boolean;
    opensea_buyer_fee_basis_points: number;
    opensea_seller_fee_basis_points: number;
    buyer_fee_basis_points: number;
    seller_fee_basis_points: number;
    payout_address: string;
  };
  permalink: string;
  collection: {
    banner_image_url: string;
    chat_url: string;
    created_date: string;
    default_to_fiat: boolean;
    description: string;
    dev_buyer_fee_basis_points: string;
    dev_seller_fee_basis_points: string;
    discord_url: string;
    external_url: string;
    featured: boolean;
    featured_image_url: string;
    hidden: boolean;
    safelist_request_status: string;
    image_url: string;
    is_subject_to_whitelist: boolean;
    large_image_url: string;
    medium_username: string;
    name: string;
    only_proxied_transfers: boolean;
    opensea_buyer_fee_basis_points: string;
    opensea_seller_fee_basis_points: string;
    payout_address: string;
    require_email: boolean;
    short_description: string;
    slug: string;
    telegram_url: string;
    twitter_username: string;
    instagram_username: string;
    wiki_url: string;
  };
  decimals: number;
  token_metadata: string;
  owner: {
    user: {
      username: string;
    };
    profile_img_url: string;
    address: string;
    config: string;
  };
  sell_orders: any[];
  creator: {
    user: {
      username: string;
    };
    profile_img_url: string;
    address: string;
    config: string;
  };
  traits: any[];
  last_sale: any;
  top_bid: any;
  listing_date: string;
  is_presale: boolean;
  transfer_fee_payment_token: any;
  transfer_fee: any;
}

// Rate limiting utility
class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private timeWindow: number;

  constructor(maxRequests: number = 10, timeWindow: number = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.timeWindow - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.requests.push(now);
  }
}

const rateLimiter = new RateLimiter(8, 60000); // 8 requests per minute

// Base API call function
async function makeOpenSeaRequest(endpoint: string, params?: Record<string, string>): Promise<any> {
  await rateLimiter.waitForSlot();
  
  const url = new URL(endpoint, 'http://localhost:3001');
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error(`OpenSea API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// Get NFT events
export async function getNFTEvents(
  contractAddress: string,
  tokenId: string,
  options?: {
    event_type?: string;
    occurred_after?: string;
    occurred_before?: string;
    cursor?: string;
  }
): Promise<OpenSeaEventsResponse> {
  const params: Record<string, string> = {};
  if (options?.event_type) params.event_type = options.event_type;
  if (options?.occurred_after) params.occurred_after = options.occurred_after;
  if (options?.occurred_before) params.occurred_before = options.occurred_before;
  if (options?.cursor) params.cursor = options.cursor;

  return makeOpenSeaRequest(`/api/events/${contractAddress}/${tokenId}`, params);
}

// Get collection events
export async function getCollectionEvents(
  contractAddress: string,
  options?: {
    event_type?: string;
    occurred_after?: string;
    occurred_before?: string;
    cursor?: string;
    limit?: number;
  }
): Promise<OpenSeaEventsResponse> {
  const params: Record<string, string> = {};
  if (options?.event_type) params.event_type = options.event_type;
  if (options?.occurred_after) params.occurred_after = options.occurred_after;
  if (options?.occurred_before) params.occurred_before = options.occurred_before;
  if (options?.cursor) params.cursor = options.cursor;
  if (options?.limit) params.limit = options.limit.toString();

  return makeOpenSeaRequest(`/api/collection-events/${contractAddress}`, params);
}

// Get NFT asset details
export async function getNFTAsset(
  contractAddress: string,
  tokenId: string
): Promise<OpenSeaAsset> {
  return makeOpenSeaRequest(`/api/price/${contractAddress}/${tokenId}`);
}

// Get multiple NFT events with pagination
export async function getAllNFTEvents(
  contractAddress: string,
  tokenId: string,
  eventType?: string
): Promise<OpenSeaEvent[]> {
  const allEvents: OpenSeaEvent[] = [];
  let cursor: string | undefined;
  
  do {
    const response = await getNFTEvents(contractAddress, tokenId, {
      event_type: eventType,
      cursor
    });
    
    allEvents.push(...response.asset_events);
    cursor = response.next_cursor;
  } while (cursor);
  
  return allEvents;
}

// Get recent events for multiple NFTs
export async function getRecentEventsForNFTs(
  nfts: Array<{ contractAddress: string; tokenId: string; title: string }>,
  daysBack: number = 30
): Promise<Record<string, OpenSeaEvent[]>> {
  const events: Record<string, OpenSeaEvent[]> = {};
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);
  
  for (const nft of nfts) {
    try {
      const nftEvents = await getNFTEvents(nft.contractAddress, nft.tokenId, {
        occurred_after: cutoffDate.toISOString()
      });
      
      events[`${nft.contractAddress}-${nft.tokenId}`] = nftEvents.asset_events;
    } catch (error) {
      console.warn(`Failed to fetch events for ${nft.title}:`, error);
      events[`${nft.contractAddress}-${nft.tokenId}`] = [];
    }
  }
  
  return events;
}

// Utility functions
export const formatPrice = (price: string, paymentToken?: any): string => {
  if (!price || !paymentToken) return 'N/A';
  
  const priceNum = parseFloat(price) / Math.pow(10, paymentToken.decimals);
  const symbol = paymentToken.symbol || 'ETH';
  
  if (paymentToken.usd_price) {
    const usdPrice = priceNum * paymentToken.usd_price;
    return `${priceNum.toFixed(4)} ${symbol} ($${usdPrice.toFixed(2)})`;
  }
  
  return `${priceNum.toFixed(4)} ${symbol}`;
};

export const formatAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatDate = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString();
};

export const EVENT_TYPES = {
  'created': 'Listed',
  'successful': 'Sold',
  'cancelled': 'Cancelled',
  'bid_entered': 'Bid Placed',
  'bid_withdrawn': 'Bid Withdrawn',
  'transfer': 'Transferred',
  'approve': 'Approved'
} as const; 