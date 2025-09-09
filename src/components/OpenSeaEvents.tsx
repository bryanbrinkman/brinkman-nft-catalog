import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Link
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Event as EventIcon,
  Sell as SellIcon,
  ShoppingCart as BuyIcon,
  Gavel as BidIcon,
  Cancel as CancelIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';

interface NFTEvent {
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

interface OpenSeaEventsProps {
  contractAddress: string;
  tokenId?: string;
  nftTitle?: string;
}

const EVENT_TYPES = {
  'created': 'Listed',
  'successful': 'Sold',
  'cancelled': 'Cancelled',
  'bid_entered': 'Bid Placed',
  'bid_withdrawn': 'Bid Withdrawn',
  'transfer': 'Transferred',
  'approve': 'Approved'
};

const getEventIcon = (eventType: string) => {
  switch (eventType) {
    case 'created':
      return <SellIcon />;
    case 'successful':
      return <BuyIcon />;
    case 'bid_entered':
      return <BidIcon />;
    case 'cancelled':
      return <CancelIcon />;
    case 'transfer':
      return <TrendingUpIcon />;
    default:
      return <EventIcon />;
  }
};

const formatPrice = (price: string, paymentToken?: any) => {
  if (!price || !paymentToken) return 'N/A';
  
  const priceNum = parseFloat(price) / Math.pow(10, paymentToken.decimals);
  const symbol = paymentToken.symbol || 'ETH';
  
  if (paymentToken.usd_price) {
    const usdPrice = priceNum * paymentToken.usd_price;
    return `${priceNum.toFixed(4)} ${symbol} ($${usdPrice.toFixed(2)})`;
  }
  
  return `${priceNum.toFixed(4)} ${symbol}`;
};

const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const formatDate = (timestamp: string) => {
  return new Date(timestamp).toLocaleString();
};

export const OpenSeaEvents: React.FC<OpenSeaEventsProps> = ({
  contractAddress,
  tokenId,
  nftTitle
}) => {
  const [events, setEvents] = useState<NFTEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (eventTypeFilter) params.append('event_type', eventTypeFilter);
      if (dateFilter) {
        const date = new Date(dateFilter);
        params.append('occurred_after', date.toISOString());
      }

      const url = tokenId 
        ? `/api/events/${contractAddress}/${tokenId}?${params.toString()}`
        : `/api/collection-events/${contractAddress}?${params.toString()}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status}`);
      }

      const data = await response.json();
      setEvents(data.asset_events || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contractAddress) {
      fetchEvents();
    }
  }, [contractAddress, tokenId, eventTypeFilter, dateFilter]);

  const handleEventExpand = (eventId: string) => {
    setExpandedEvent(expandedEvent === eventId ? null : eventId);
  };

  const handleRefresh = () => {
    fetchEvents();
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="h3">
            {tokenId ? `Events for ${nftTitle || `Token #${tokenId}`}` : 'Collection Events'}
          </Typography>
          <Tooltip title="Refresh events">
            <IconButton onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Event Type</InputLabel>
              <Select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                label="Event Type"
              >
                <MenuItem value="">All Events</MenuItem>
                {Object.entries(EVENT_TYPES).map(([key, label]) => (
                  <MenuItem key={key} value={key}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Filter by Date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress />
          </Box>
        )}

        {/* Events List */}
        {!loading && events.length === 0 && !error && (
          <Typography color="text.secondary" align="center">
            No events found for this NFT
          </Typography>
        )}

        {!loading && events.length > 0 && (
          <Box>
            {events.map((event, index) => (
              <Accordion
                key={`${event.transaction?.hash}-${index}`}
                expanded={expandedEvent === `${event.transaction?.hash}-${index}`}
                onChange={() => handleEventExpand(`${event.transaction?.hash}-${index}`)}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" width="100%">
                    <Box mr={1}>
                      {getEventIcon(event.event_type)}
                    </Box>
                    <Box flexGrow={1}>
                      <Typography variant="subtitle2">
                        {EVENT_TYPES[event.event_type as keyof typeof EVENT_TYPES] || event.event_type}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(event.event_timestamp)}
                      </Typography>
                    </Box>
                    {event.ending_price && (
                      <Chip
                        label={formatPrice(event.ending_price, event.payment_token)}
                        color="primary"
                        size="small"
                      />
                    )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {event.seller && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary">
                          Seller
                        </Typography>
                        <Typography variant="body2">
                          {formatAddress(event.seller.address)}
                        </Typography>
                      </Grid>
                    )}
                    {event.winner_account && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary">
                          Buyer
                        </Typography>
                        <Typography variant="body2">
                          {formatAddress(event.winner_account.address)}
                        </Typography>
                      </Grid>
                    )}
                    {event.starting_price && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary">
                          Starting Price
                        </Typography>
                        <Typography variant="body2">
                          {formatPrice(event.starting_price, event.payment_token)}
                        </Typography>
                      </Grid>
                    )}
                    {event.transaction?.hash && (
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">
                          Transaction Hash
                        </Typography>
                        <Link
                          href={`https://etherscan.io/tx/${event.transaction.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="body2"
                        >
                          {formatAddress(event.transaction.hash)}
                        </Link>
                      </Grid>
                    )}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}; 