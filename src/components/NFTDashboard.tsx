import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Badge
} from '@mui/material';
import {
  Event as EventIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  History as HistoryIcon,
  OpenInNew as OpenInNewIcon,
  Refresh as RefreshIcon,
  Analytics as AnalyticsIcon,
  Timeline as TimelineIcon,
  Sell as SellIcon,
  ShoppingCart as BuyIcon,
  Gavel as BidIcon,
  Cancel as CancelIcon,
  TransferWithinAStation as TransferIcon
} from '@mui/icons-material';
import { OpenSeaEvents } from './OpenSeaEvents';
import { 
  getNFTEvents, 
  getCollectionEvents, 
  getNFTAsset,
  formatPrice,
  formatAddress,
  formatDate,
  EVENT_TYPES,
  type OpenSeaEvent
} from '../services/openseaService';

interface NFT {
  'Artwork Title': string;
  'Type': string;
  'Edt Size': string;
  'Mint Date': string;
  'Platform': string;
  'Collection Name': string;
  'Collaborator/Special Type': string;
  'Link': string;
  'Contract Hash': string;
  'Token Type': string;
  'TokenID Start': string;
  'Token ID End': string;
  'IPFS Image': string;
  'IPFS Json': string;
  'Pinned?': string;
  'Hosting Type': string;
  'Image link': string;
  'Price'?: string;
}

interface NFTDashboardProps {
  nft: NFT;
  onClose?: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`nft-tabpanel-${index}`}
      aria-labelledby={`nft-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const NFTDashboard: React.FC<NFTDashboardProps> = ({ nft, onClose }) => {
  const [tabValue, setTabValue] = useState(0);
  const [assetData, setAssetData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentEvents, setRecentEvents] = useState<OpenSeaEvent[]>([]);
  const [marketStats, setMarketStats] = useState({
    totalSales: 0,
    totalVolume: 0,
    averagePrice: 0,
    floorPrice: 0,
    uniqueOwners: 0
  });

  useEffect(() => {
    if (nft['Contract Hash'] && nft['TokenID Start']) {
      fetchNFTData();
    }
  }, [nft]);

  const fetchNFTData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch asset data and recent events in parallel
      const [assetResponse, eventsResponse] = await Promise.all([
        getNFTAsset(nft['Contract Hash'], nft['TokenID Start']),
        getNFTEvents(nft['Contract Hash'], nft['TokenID Start'], {
          occurred_after: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // Last 30 days
        })
      ]);

      setAssetData(assetResponse);
      setRecentEvents(eventsResponse.asset_events || []);

      // Calculate market stats from events
      const sales = eventsResponse.asset_events?.filter(e => e.event_type === 'successful') || [];
      const totalVolume = sales.reduce((sum, sale) => {
        if (sale.ending_price && sale.payment_token) {
          const price = parseFloat(sale.ending_price) / Math.pow(10, sale.payment_token.decimals);
          return sum + price;
        }
        return sum;
      }, 0);

      setMarketStats({
        totalSales: sales.length,
        totalVolume,
        averagePrice: sales.length > 0 ? totalVolume / sales.length : 0,
        floorPrice: sales.length > 0 ? Math.min(...sales.map(s => parseFloat(s.ending_price || '0'))) : 0,
        uniqueOwners: new Set(sales.map(s => s.winner_account?.address)).size
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch NFT data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'created': return <SellIcon />;
      case 'successful': return <BuyIcon />;
      case 'bid_entered': return <BidIcon />;
      case 'cancelled': return <CancelIcon />;
      case 'transfer': return <TransferIcon />;
      default: return <EventIcon />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'successful': return 'success';
      case 'created': return 'primary';
      case 'bid_entered': return 'warning';
      case 'cancelled': return 'error';
      case 'transfer': return 'info';
      default: return 'default';
    }
  };

  return (
    <Dialog 
      open={true} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{nft['Artwork Title']}</Typography>
          <Box>
            <Tooltip title="Refresh data">
              <IconButton onClick={fetchNFTData} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="View on OpenSea">
              <IconButton 
                href={nft.Link} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <OpenInNewIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* NFT Info Card */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>NFT Information</Typography>
                <Box sx={{ mb: 2 }}>
                  <img 
                    src={nft['Image link'] || nft['IPFS Image']} 
                    alt={nft['Artwork Title']}
                    style={{ width: '100%', height: 'auto', borderRadius: 8 }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </Box>
                
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Type" 
                      secondary={nft.Type} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Edition Size" 
                      secondary={nft['Edt Size']} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Mint Date" 
                      secondary={new Date(nft['Mint Date']).toLocaleDateString()} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Platform" 
                      secondary={nft.Platform} 
                    />
                  </ListItem>
                  {nft['Collaborator/Special Type'] && (
                    <ListItem>
                      <ListItemText 
                        primary="Collaborator" 
                        secondary={nft['Collaborator/Special Type']} 
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Market Stats Card */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Market Statistics</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary">
                        {marketStats.totalSales}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Total Sales
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="success.main">
                        {marketStats.totalVolume.toFixed(2)} ETH
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Total Volume
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="warning.main">
                        {marketStats.averagePrice.toFixed(4)} ETH
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Avg Price
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="info.main">
                        {marketStats.uniqueOwners}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Unique Owners
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Recent Events" icon={<EventIcon />} />
            <Tab label="Market Data" icon={<TrendingUpIcon />} />
            <Tab label="Analytics" icon={<AnalyticsIcon />} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>Recent Activity</Typography>
          {recentEvents.length === 0 ? (
            <Typography color="text.secondary" align="center">
              No recent events found for this NFT
            </Typography>
          ) : (
            <List>
              {recentEvents.slice(0, 10).map((event, index) => (
                <ListItem key={index} divider>
                  <ListItemIcon>
                    <Badge badgeContent={getEventIcon(event.event_type)} color={getEventColor(event.event_type)}>
                      <EventIcon />
                    </Badge>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip 
                          label={EVENT_TYPES[event.event_type as keyof typeof EVENT_TYPES] || event.event_type}
                          color={getEventColor(event.event_type)}
                          size="small"
                        />
                        {event.ending_price && (
                          <Chip 
                            label={formatPrice(event.ending_price, event.payment_token)}
                            variant="outlined"
                            size="small"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          {formatDate(event.event_timestamp)}
                        </Typography>
                        {event.seller && (
                          <Typography variant="caption" color="text.secondary">
                            Seller: {formatAddress(event.seller.address)}
                          </Typography>
                        )}
                        {event.winner_account && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Buyer: {formatAddress(event.winner_account.address)}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <OpenSeaEvents
            contractAddress={nft['Contract Hash']}
            tokenId={nft['TokenID Start']}
            nftTitle={nft['Artwork Title']}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>Price Analytics</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>Price History</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Chart showing price movements over time
                  </Typography>
                  {/* Placeholder for price chart */}
                  <Box sx={{ height: 200, bgcolor: 'grey.100', borderRadius: 1, mt: 2 }} />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>Volume Analysis</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Trading volume and liquidity metrics
                  </Typography>
                  {/* Placeholder for volume chart */}
                  <Box sx={{ height: 200, bgcolor: 'grey.100', borderRadius: 1, mt: 2 }} />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}; 