import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Container, 
  Grid, 
  Typography, 
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  CircularProgress,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Link,
  Card,
  CssBaseline,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import { 
  FilterList as FilterIcon,
  ViewList as GridIcon,
  ViewComfy as GalleryIcon,
  Search as SearchIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  Refresh as RefreshIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  Collections as CollectionsIcon,
  CalendarToday as CalendarIcon,
  Event as EventIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Papa from 'papaparse';
import { OpenSeaEvents } from './components/OpenSeaEvents';
import { NFTDashboard } from './components/NFTDashboard';
import { NFTEventButton } from './components/NFTEventButton';

// Helper function to delay between API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

type SortField = 'Artwork Title' | 'Mint Date' | 'Type' | 'Edt Size' | 'Platform' | 'Collaborator/Special Type' | 'Price';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'grid' | 'gallery';

function App() {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [filteredNfts, setFilteredNfts] = useState<NFT[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [platformFilter, setPlatformFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [collaboratorFilter, setCollaboratorFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('Mint Date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [isPriceLoading, setIsPriceLoading] = useState<boolean>(false);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [darkMode, setDarkMode] = useState<boolean>(false);
  
  // Enhanced Price Features & Analytics
  const [portfolioValue, setPortfolioValue] = useState<number>(0);
  const [priceHistory, setPriceHistory] = useState<Record<string, Array<{date: string, price: number}>>>({});
  const [showAnalytics, setShowAnalytics] = useState<boolean>(false);
  const [priceAlerts, setPriceAlerts] = useState<Record<string, {targetPrice: number, isAbove: boolean}>>({});
  const [showPriceAlerts, setShowPriceAlerts] = useState<boolean>(false);
  const [collectionStats, setCollectionStats] = useState<{
    totalPieces: number;
    uniquePieces: number;
    editionPieces: number;
    generativePieces: number;
    platforms: Record<string, number>;
    years: Record<string, number>;
    totalValue: number;
    averagePrice: number;
  }>({
    totalPieces: 0,
    uniquePieces: 0,
    editionPieces: 0,
    generativePieces: 0,
    platforms: {},
    years: {},
    totalValue: 0,
    averagePrice: 0
  });

  // OpenSea API Integration State
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [showNFTDashboard, setShowNFTDashboard] = useState<boolean>(false);
  const [showOpenSeaEvents, setShowOpenSeaEvents] = useState<boolean>(false);
  const [selectedNFTForEvents, setSelectedNFTForEvents] = useState<NFT | null>(null);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const theme = useMemo(() => createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      background: {
        default: darkMode ? '#181a20' : '#f5f5f5',
        paper: darkMode ? '#23272f' : '#fff',
      },
      primary: {
        main: darkMode ? '#90caf9' : '#1976d2',
      },
    },
    shape: {
      borderRadius: 8,
    },
  }), [darkMode]);

  useEffect(() => {
    // Load CSV data
    fetch('./Brinkman NFT Catalog - Sheet1 (17).csv')
      .then(response => response.text())
      .then(data => {
        Papa.parse(data, {
          header: true,
          transformHeader: (header, index) => {
            // The first column has no header, so we'll name it 'Artwork Title'
            return header || 'Artwork Title';
          },
          complete: (results) => {
            setNfts(results.data as NFT[]);
            setFilteredNfts(results.data as NFT[]);
            setLoading(false);
          }
        });
      });
  }, []);

  useEffect(() => {
    let filtered = nfts;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(nft => 
        nft['Artwork Title']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nft['Collection Name']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nft.Platform?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nft.Type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nft['Collaborator/Special Type']?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply platform filter
    if (platformFilter) {
      filtered = filtered.filter(nft => nft.Platform === platformFilter);
    }

    // Apply type filter
    if (typeFilter) {
      filtered = filtered.filter(nft => nft.Type === typeFilter);
    }

    // Apply collaborator filter
    if (collaboratorFilter) {
      filtered = filtered.filter(nft => nft['Collaborator/Special Type'] === collaboratorFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField] || '';
      let bValue = b[sortField] || '';
      
      // Handle price sorting with separate prices state
      if (sortField === 'Price') {
        const aPrice = prices[`${a['Contract Hash']}-${a['TokenID Start']}`] || '';
        const bPrice = prices[`${b['Contract Hash']}-${b['TokenID Start']}`] || '';
        
        // Extract numeric values from price strings (e.g., "2.5 ETH (Floor)" -> 2.5)
        const aNum = parseFloat(aPrice.match(/[\d.]+/)?.[0] || '0');
        const bNum = parseFloat(bPrice.match(/[\d.]+/)?.[0] || '0');
        
        return sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
      }
      
      if (sortField === 'Mint Date') {
        // Convert dates to timestamps for proper sorting
        const aDate = new Date(aValue).getTime();
        const bDate = new Date(bValue).getTime();
        return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
      }

      if (sortField === 'Edt Size') {
        // Convert edition sizes to numbers for proper sorting
        const aNum = parseInt(aValue) || 0;
        const bNum = parseInt(bValue) || 0;
        return sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
      }
      
      // String comparison for other fields
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredNfts(filtered);
  }, [searchTerm, platformFilter, typeFilter, collaboratorFilter, nfts, sortField, sortOrder, prices]);

  const platforms = [...new Set(nfts.map(nft => nft.Platform))].filter(Boolean);
  const types = [...new Set(nfts.map(nft => nft.Type))].filter(Boolean);
  const collaborators = [...new Set(nfts.map(nft => nft['Collaborator/Special Type']))].filter(Boolean);

  const getImageUrl = async (nft: NFT): Promise<string> => {
    // First try the direct image link if available
    if (nft['Image link']) {
      // For 'Machine' and similar cases, just return the direct link and let the browser handle errors
      if (nft['Artwork Title'] === 'Machine') {
        return nft['Image link'];
      }
      try {
        const response = await fetch(nft['Image link'], { method: 'HEAD' });
        if (response.ok) {
          console.log('Direct image link found for:', nft['Artwork Title']);
          return nft['Image link'];
        }
      } catch (error) {
        console.warn('Error fetching from direct image link for:', nft['Artwork Title'], error);
      }
    }

    // Then try OpenSea API if we have contract and token info
    if (nft['Contract Hash'] && nft['TokenID Start']) {
      try {
        // Add a small delay to avoid rate limiting
        await delay(100);
        
        const response = await fetch(
          `https://api.opensea.io/api/v2/chain/ethereum/contract/${nft['Contract Hash']}/nfts/${nft['TokenID Start']}`,
          {
            headers: {
              'Accept': 'application/json'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.nft && data.nft.image_url) {
            console.log('OpenSea image found for:', nft['Artwork Title']);
            return data.nft.image_url;
          }
        } else {
          console.warn('OpenSea API error for:', nft['Artwork Title'], await response.text());
        }
      } catch (error) {
        console.error('Error fetching from OpenSea for:', nft['Artwork Title'], error);
      }
    }

    // Try IPFS if available
    if (nft['IPFS Image']) {
      try {
        const ipfsHash = nft['IPFS Image'].trim();
        // Remove 'ipfs://' if present and any trailing slashes
        const cleanHash = ipfsHash.replace('ipfs://', '').replace(/\/+$/, '');
        
        const gateways = [
          'https://nftstorage.link/ipfs/',
          'https://ipfs.io/ipfs/',
          'https://gateway.pinata.cloud/ipfs/',
          'https://dweb.link/ipfs/',
          'https://gateway.ipfs.io/ipfs/',
          'https://cloudflare-ipfs.com/ipfs/'
        ];

        // Try each gateway in sequence until one works
        for (const gateway of gateways) {
          try {
            const url = `${gateway}${cleanHash}`;
            // Test if the image is accessible with a timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

            const response = await fetch(url, { 
              method: 'HEAD',
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);

            if (response.ok) {
              console.log('IPFS image found at', gateway, 'for:', nft['Artwork Title']);
              return url;
            }
          } catch (error: any) {
            if (error.name === 'AbortError') {
              console.warn('Gateway timeout:', gateway, 'for:', nft['Artwork Title']);
            } else {
              console.warn('Failed to load from gateway:', gateway, 'for:', nft['Artwork Title']);
            }
            continue;
          }
        }
      } catch (error) {
        console.error('Error processing IPFS image for:', nft['Artwork Title'], error);
      }
    }

    // If we have a Link field that points to an image, try that
    if (nft.Link && (
      nft.Link.endsWith('.jpg') || 
      nft.Link.endsWith('.jpeg') || 
      nft.Link.endsWith('.png') || 
      nft.Link.endsWith('.gif')
    )) {
      try {
        // Skip direct HEAD requests to OpenSea website URLs
        if (nft.Link.includes('opensea.io/assets')) {
          console.log('Skipping direct OpenSea website URL:', nft.Link);
          // Try to get the image from OpenSea API instead
          if (nft['Contract Hash'] && nft['TokenID Start']) {
            try {
              const response = await fetch(
                `https://api.opensea.io/api/v2/chain/ethereum/contract/${nft['Contract Hash']}/nfts/${nft['TokenID Start']}`,
                {
                  headers: {
                    'Accept': 'application/json'
                  }
                }
              );

              if (response.ok) {
                const data = await response.json();
                if (data.nft && data.nft.image_url) {
                  console.log('OpenSea API image found for:', nft['Artwork Title']);
                  return data.nft.image_url;
                }
              }
            } catch (error) {
              console.warn('OpenSea API error for:', nft['Artwork Title'], error);
            }
          }
        } else {
          // For non-OpenSea URLs, try the direct link
          const response = await fetch(nft.Link, { method: 'HEAD' });
          if (response.ok) {
            console.log('Direct link image found for:', nft['Artwork Title']);
            return nft.Link;
          }
        }
      } catch (error) {
        console.warn('Error fetching from direct link for:', nft['Artwork Title'], error);
      }
    }

    console.warn('No valid image found for:', nft['Artwork Title']);
    return 'https://via.placeholder.com/300x300?text=No+Image';
  };

  // Update ImageWithFallback component to handle async image URL
  const ImageWithFallback = ({ nft, style }: { nft: NFT, style: React.CSSProperties }) => {
    const [currentSrc, setCurrentSrc] = useState<string>('https://via.placeholder.com/300x300?text=Loading...');
    const [errorCount, setErrorCount] = useState(0);
    const maxRetries = 3;
    
    // Use a stable key based on NFT identifier to prevent unnecessary re-renders
    const nftKey = `${nft['Contract Hash']}-${nft['TokenID Start']}-${nft['Artwork Title']}`;
    
    useEffect(() => {
      let isMounted = true;
      
      const loadImage = async () => {
        try {
          const imageUrl = await getImageUrl(nft);
          if (isMounted) {
            setCurrentSrc(imageUrl);
          }
        } catch (error) {
          console.error('Error loading image for:', nft['Artwork Title'], error);
          if (isMounted) {
            setCurrentSrc('https://via.placeholder.com/300x300?text=Error+Loading+Image');
          }
        }
      };
      
      loadImage();
      
      return () => {
        isMounted = false;
      };
    }, [nftKey]); // Only depend on the stable key, not the entire nft object

    const handleError = async () => {
      console.warn('Image load error for:', nft['Artwork Title'], 'attempt:', errorCount + 1);
      if (errorCount < maxRetries) {
        setErrorCount(prev => prev + 1);
        try {
          const newUrl = await getImageUrl(nft);
          setCurrentSrc(newUrl);
        } catch (error) {
          console.error('Error in retry for:', nft['Artwork Title'], error);
          setCurrentSrc('https://via.placeholder.com/300x300?text=Image+Not+Available');
        }
      } else {
        console.error('Max retries reached for:', nft['Artwork Title']);
        setCurrentSrc('https://via.placeholder.com/300x300?text=Image+Not+Available');
      }
    };

    return (
      <img
        src={currentSrc}
        alt={nft['Artwork Title'] || 'NFT'}
        style={style}
        onError={handleError}
      />
    );
  };

  const handleColumnClick = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setPlatformFilter('');
    setTypeFilter('');
    setCollaboratorFilter('');
    setSortField('Mint Date');
    setSortOrder('desc');
  };

  // OpenSea API Integration Functions
  const handleNFTDashboardOpen = (nft: NFT) => {
    setSelectedNFT(nft);
    setShowNFTDashboard(true);
  };

  const handleNFTDashboardClose = () => {
    setShowNFTDashboard(false);
    setSelectedNFT(null);
  };

  const handleOpenSeaEventsOpen = (nft: NFT) => {
    setSelectedNFTForEvents(nft);
    setShowOpenSeaEvents(true);
  };

  const handleOpenSeaEventsClose = () => {
    setShowOpenSeaEvents(false);
    setSelectedNFTForEvents(null);
  };

  // Updated price fetching function using Alchemy API
  const fetchOpenSeaPrice = useCallback(async (contractAddress: string, tokenId: string, isUnique: boolean = false): Promise<string> => {
    try {
      await delay(100); // Rate limiting delay
      
      const alchemyApiKey = '5gwcGwhpJmXp-nH6tFvxQQINapw_PFZL';
      
      if (isUnique) {
        // For Unique pieces, fetch the specific token's listing price
        const response = await fetch(
          `https://eth-mainnet.g.alchemy.com/nft/v3/${alchemyApiKey}/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${tokenId}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            }
          }
        );

        if (!response.ok) {
          console.warn('Alchemy API error for token:', await response.text());
          return 'Not Listed';
        }

        const data = await response.json();
        console.log('Alchemy token metadata:', data);
        
        // Check if the token is listed for sale
        if (data.openSea && data.openSea.floorPrice) {
          const price = data.openSea.floorPrice;
          return `${price} ETH (Listed)`;
        }
        
        return 'Not Listed';
      } else {
        // For editions/generative, fetch collection floor price
        const response = await fetch(
          `https://eth-mainnet.g.alchemy.com/nft/v3/${alchemyApiKey}/getFloorPrice?contractAddress=${contractAddress}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            }
          }
        );

        if (!response.ok) {
          console.warn('Alchemy API error:', await response.text());
          return 'Not Listed';
        }

        const data = await response.json();
        console.log('Alchemy floor price data:', data);
        
        if (data.openSea && data.openSea.floorPrice) {
          const floorPrice = data.openSea.floorPrice;
          return `${floorPrice} ETH (Floor)`;
        }

        return 'Not Listed';
      }
    } catch (error) {
      console.error('Error fetching price:', error);
      return 'Error';
    }
  }, []);

  // Function to fetch all prices
  const fetchAllPrices = useCallback(async () => {
    if (isPriceLoading) return; // Prevent multiple simultaneous updates
    
    setIsPriceLoading(true);
    console.log('Starting price fetch for', nfts.length, 'artworks');
    
    const updatedPrices: Record<string, string> = {};
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < nfts.length; i++) {
      const nft = nfts[i];
      
      if (nft['Contract Hash'] && nft['TokenID Start']) {
        try {
          const price = await fetchOpenSeaPrice(nft['Contract Hash'], nft['TokenID Start'], nft['Type'] === 'Unique');
          if (price !== 'Error') {
            const nftKey = `${nft['Contract Hash']}-${nft['TokenID Start']}`;
            updatedPrices[nftKey] = price;
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error('Error updating price for:', nft['Artwork Title'], error);
          errorCount++;
        }
      }
    }

    if (Object.keys(updatedPrices).length > 0) {
      console.log(`Price update complete. Success: ${successCount}, Errors: ${errorCount}`);
      setPrices(prev => ({ ...prev, ...updatedPrices }));
    }
    
    setIsPriceLoading(false);
  }, [nfts, fetchOpenSeaPrice, isPriceLoading]);

  // Set up periodic price refresh
  useEffect(() => {
    // Initial price fetch
    fetchAllPrices();

    // Set up interval for periodic updates
    const interval = setInterval(fetchAllPrices, 5 * 60 * 1000); // Update every 5 minutes

    return () => clearInterval(interval);
  }, [fetchAllPrices]);

  // Calculate collection analytics
  const calculateAnalytics = useCallback(() => {
    const stats = {
      totalPieces: nfts.length,
      uniquePieces: nfts.filter(nft => nft['Type'] === 'Unique').length,
      editionPieces: nfts.filter(nft => nft['Type'] === 'Edition').length,
      generativePieces: nfts.filter(nft => nft['Type'] === 'Generative').length,
      platforms: {} as Record<string, number>,
      years: {} as Record<string, number>,
      totalValue: 0,
      averagePrice: 0
    };

    // Calculate platform distribution
    nfts.forEach(nft => {
      const platform = nft['Platform'];
      stats.platforms[platform] = (stats.platforms[platform] || 0) + 1;
    });

    // Calculate year distribution
    nfts.forEach(nft => {
      const year = nft['Mint Date']?.split('/')[2] || 'Unknown';
      stats.years[year] = (stats.years[year] || 0) + 1;
    });

    // Calculate portfolio value
    let totalValue = 0;
    let priceCount = 0;
    
    nfts.forEach(nft => {
      const nftKey = `${nft['Contract Hash']}-${nft['TokenID Start']}`;
      const priceStr = prices[nftKey];
      
      if (priceStr && priceStr !== 'Not Listed' && priceStr !== 'Error') {
        const priceMatch = priceStr.match(/(\d+\.?\d*)\s*ETH/);
        if (priceMatch) {
          const price = parseFloat(priceMatch[1]);
          totalValue += price;
          priceCount++;
        }
      }
    });

    stats.totalValue = totalValue;
    stats.averagePrice = priceCount > 0 ? totalValue / priceCount : 0;

    setCollectionStats(stats);
    setPortfolioValue(totalValue);
  }, [nfts, prices]);

  // Update analytics when prices change
  useEffect(() => {
    calculateAnalytics();
  }, [calculateAnalytics]);

  // Price Alert Functions
  const addPriceAlert = (nftKey: string, targetPrice: number, isAbove: boolean) => {
    setPriceAlerts(prev => ({
      ...prev,
      [nftKey]: { targetPrice, isAbove }
    }));
  };

  const removePriceAlert = (nftKey: string) => {
    setPriceAlerts(prev => {
      const newAlerts = { ...prev };
      delete newAlerts[nftKey];
      return newAlerts;
    });
  };

  const checkPriceAlerts = useCallback(() => {
    Object.entries(priceAlerts).forEach(([nftKey, alert]) => {
      const currentPriceStr = prices[nftKey];
      if (currentPriceStr && currentPriceStr !== 'Not Listed' && currentPriceStr !== 'Error') {
        const priceMatch = currentPriceStr.match(/(\d+\.?\d*)\s*ETH/);
        if (priceMatch) {
          const currentPrice = parseFloat(priceMatch[1]);
          const shouldTrigger = alert.isAbove ? 
            currentPrice >= alert.targetPrice : 
            currentPrice <= alert.targetPrice;
          
          if (shouldTrigger) {
            // In a real app, you'd show a notification here
            console.log(`Price alert triggered for ${nftKey}: ${currentPrice} ETH ${alert.isAbove ? '>=' : '<='} ${alert.targetPrice} ETH`);
          }
        }
      }
    });
  }, [priceAlerts, prices]);

  // Check price alerts when prices update
  useEffect(() => {
    checkPriceAlerts();
  }, [checkPriceAlerts]);

  // Analytics Component
  const AnalyticsPanel = () => (
    <Box sx={{ 
      mb: 3, 
      p: 3, 
      bgcolor: 'background.paper', 
      borderRadius: 2, 
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: '1px solid',
      borderColor: 'divider'
    }}>
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <AnalyticsIcon />
        Collection Analytics
      </Typography>
      
      <Grid container spacing={3}>
        {/* Portfolio Value */}
        <Grid item xs={12} md={3}>
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.main', color: 'white', borderRadius: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              {portfolioValue.toFixed(2)} ETH
            </Typography>
            <Typography variant="body2">Total Portfolio Value</Typography>
          </Box>
        </Grid>

        {/* Collection Stats */}
        <Grid item xs={12} md={3}>
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'secondary.main', color: 'white', borderRadius: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              {collectionStats.totalPieces}
            </Typography>
            <Typography variant="body2">Total Pieces</Typography>
          </Box>
        </Grid>

        <Grid item xs={12} md={3}>
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.main', color: 'white', borderRadius: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              {collectionStats.uniquePieces}
            </Typography>
            <Typography variant="body2">Unique Pieces</Typography>
          </Box>
        </Grid>

        <Grid item xs={12} md={3}>
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.main', color: 'white', borderRadius: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              {collectionStats.averagePrice.toFixed(2)} ETH
            </Typography>
            <Typography variant="body2">Average Price</Typography>
          </Box>
        </Grid>

        {/* Platform Distribution */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CollectionsIcon />
            Platform Distribution
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {Object.entries(collectionStats.platforms)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 8)
              .map(([platform, count]) => (
                <Chip
                  key={platform}
                  label={`${platform}: ${count}`}
                  variant="outlined"
                  size="small"
                  sx={{ mb: 1 }}
                />
              ))}
          </Box>
        </Grid>

        {/* Year Distribution */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarIcon />
            Year Distribution
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {Object.entries(collectionStats.years)
              .sort(([a], [b]) => b.localeCompare(a))
              .slice(0, 8)
              .map(([year, count]) => (
                <Chip
                  key={year}
                  label={`${year}: ${count}`}
                  variant="outlined"
                  size="small"
                  sx={{ mb: 1 }}
                />
              ))}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="xl" sx={{ py: 2, bgcolor: 'background.default' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box sx={{ mb: 2, width: '150px', height: 'auto', bgcolor: darkMode ? '#23272f' : '#fff', borderRadius: 2, p: 1 }}>
            <img 
              src={darkMode ? "/brinkman-nft-catalog/catlogo_Darkmode.png" : "/brinkman-nft-catalog/catlogo.png"} 
              alt="Cat Logo" 
              style={{ 
                width: '100%', 
                height: 'auto',
                display: 'block'
              }} 
            />
          </Box>
          <Box sx={{ width: '100%', mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                {showSearch && (
                  <TextField
                    fullWidth
                    label="Search"
                    variant="outlined"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, platform, type, or collaborator"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: 'rgba(0, 0, 0, 0.23)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(0, 0, 0, 0.87)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#1976d2',
                        },
                        backgroundColor: '#ffffff',
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(0, 0, 0, 0.87)',
                      },
                      '& .MuiInputBase-input': {
                        color: 'rgba(0, 0, 0, 0.87)',
                      },
                    }}
                  />
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                <Box display="flex" justifyContent="flex-end" gap={1}>
                  <Tooltip title="Toggle Search">
                    <IconButton 
                      onClick={() => {
                        setShowSearch(!showSearch);
                        if (showSearch) setSearchTerm(''); // Clear search when hiding
                      }}
                      sx={{ color: showSearch ? '#1976d2' : darkMode ? '#fff' : 'rgba(0, 0, 0, 0.87)' }}
                    >
                      <SearchIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Toggle Filters">
                    <IconButton 
                      onClick={() => setShowFilters(!showFilters)} 
                      sx={{ color: showFilters ? '#1976d2' : darkMode ? '#fff' : 'rgba(0, 0, 0, 0.87)' }}
                    >
                      <FilterIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Grid View">
                    <IconButton 
                      onClick={() => setViewMode('grid')} 
                      sx={{ color: viewMode === 'grid' ? '#1976d2' : darkMode ? '#fff' : 'rgba(0, 0, 0, 0.87)' }}
                    >
                      <GridIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Gallery View">
                    <IconButton 
                      onClick={() => setViewMode('gallery')} 
                      sx={{ color: viewMode === 'gallery' ? '#1976d2' : darkMode ? '#fff' : 'rgba(0, 0, 0, 0.87)' }}
                    >
                      <GalleryIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
                    <IconButton onClick={() => setDarkMode((prev: boolean) => !prev)} sx={{ color: darkMode ? '#fff' : 'rgba(0, 0, 0, 0.87)' }}>
                      {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Refresh Prices">
                    <IconButton 
                      onClick={fetchAllPrices}
                      disabled={isPriceLoading}
                      sx={{ 
                        color: isPriceLoading ? 'rgba(0, 0, 0, 0.38)' : darkMode ? '#fff' : 'rgba(0, 0, 0, 0.87)',
                        '&:hover': {
                          color: isPriceLoading ? 'rgba(0, 0, 0, 0.38)' : '#1976d2'
                        }
                      }}
                    >
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Toggle Analytics">
                    <IconButton 
                      onClick={() => setShowAnalytics(!showAnalytics)}
                      sx={{ 
                        color: showAnalytics ? '#1976d2' : darkMode ? '#fff' : 'rgba(0, 0, 0, 0.87)',
                        '&:hover': {
                          color: '#1976d2'
                        }
                      }}
                    >
                      <TrendingUpIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Price Alerts">
                    <IconButton 
                      onClick={() => setShowPriceAlerts(!showPriceAlerts)}
                      sx={{ 
                        color: showPriceAlerts ? '#1976d2' : darkMode ? '#fff' : 'rgba(0, 0, 0, 0.87)',
                        '&:hover': {
                          color: '#1976d2'
                        }
                      }}
                    >
                      <AnalyticsIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {showFilters && (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: '#ffffff', borderRadius: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>
              <Grid container spacing={1.5}>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>Platform</InputLabel>
                    <Select
                      value={platformFilter}
                      label="Platform"
                      onChange={(e) => setPlatformFilter(e.target.value)}
                      sx={{ 
                        color: 'rgba(0, 0, 0, 0.87)',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(0, 0, 0, 0.23)',
                        },
                      }}
                    >
                      <MenuItem value="">All Platforms</MenuItem>
                      {platforms.map((platform) => (
                        <MenuItem key={platform} value={platform}>
                          {platform}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>Type</InputLabel>
                    <Select
                      value={typeFilter}
                      label="Type"
                      onChange={(e) => setTypeFilter(e.target.value)}
                      sx={{ 
                        color: 'rgba(0, 0, 0, 0.87)',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(0, 0, 0, 0.23)',
                        },
                      }}
                    >
                      <MenuItem value="">All Types</MenuItem>
                      {types.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>Collaborator</InputLabel>
                    <Select
                      value={collaboratorFilter}
                      label="Collaborator"
                      onChange={(e) => setCollaboratorFilter(e.target.value)}
                      sx={{ 
                        color: 'rgba(0, 0, 0, 0.87)',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(0, 0, 0, 0.23)',
                        },
                      }}
                    >
                      <MenuItem value="">All Collaborators</MenuItem>
                      {collaborators.map((collaborator) => (
                        <MenuItem key={collaborator} value={collaborator}>
                          {collaborator}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box display="flex" alignItems="center" height="100%">
                    <Chip 
                      label="Clear Filters" 
                      onClick={clearFilters} 
                      color="primary" 
                      variant="outlined"
                      sx={{ width: '100%' }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}

          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ color: darkMode ? '#fff' : 'rgba(0, 0, 0, 0.87)' }}>
                Showing {filteredNfts.length} Artworks
              </Typography>
              {isPriceLoading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" sx={{ color: darkMode ? '#fff' : 'rgba(0, 0, 0, 0.87)' }}>
                    Loading prices...
                  </Typography>
                </Box>
              )}
              {!isPriceLoading && Object.keys(prices).length > 0 && (
                <Typography variant="body2" sx={{ color: darkMode ? '#fff' : 'rgba(0, 0, 0, 0.87)' }}>
                  • {Object.keys(prices).length} prices loaded
                </Typography>
              )}
            </Box>
            <Stack direction="row" spacing={1}>
              <Chip 
                label="Unique" 
                onClick={() => setTypeFilter(typeFilter === 'Unique' ? '' : 'Unique')}
                sx={{
                  color: typeFilter === 'Unique' ? 'primary.contrastText' : 'text.primary',
                  backgroundColor: typeFilter === 'Unique' ? 'primary.main' : 'background.paper',
                  borderColor: 'divider',
                  '&:hover': {
                    backgroundColor: typeFilter === 'Unique' ? 'primary.dark' : 'action.hover',
                  },
                }}
                variant={typeFilter === 'Unique' ? 'filled' : 'outlined'}
              />
              <Chip 
                label="Edition" 
                onClick={() => setTypeFilter(typeFilter === 'Edition' ? '' : 'Edition')}
                sx={{
                  color: typeFilter === 'Edition' ? 'primary.contrastText' : 'text.primary',
                  backgroundColor: typeFilter === 'Edition' ? 'primary.main' : 'background.paper',
                  borderColor: 'divider',
                  '&:hover': {
                    backgroundColor: typeFilter === 'Edition' ? 'primary.dark' : 'action.hover',
                  },
                }}
                variant={typeFilter === 'Edition' ? 'filled' : 'outlined'}
              />
              <Chip 
                label="Generative" 
                onClick={() => setTypeFilter(typeFilter === 'Generative' ? '' : 'Generative')}
                sx={{
                  color: typeFilter === 'Generative' ? 'primary.contrastText' : 'text.primary',
                  backgroundColor: typeFilter === 'Generative' ? 'primary.main' : 'background.paper',
                  borderColor: 'divider',
                  '&:hover': {
                    backgroundColor: typeFilter === 'Generative' ? 'primary.dark' : 'action.hover',
                  },
                }}
                variant={typeFilter === 'Generative' ? 'filled' : 'outlined'}
              />
              <Chip 
                label="Series" 
                onClick={() => setTypeFilter(typeFilter === 'Series' ? '' : 'Series')}
                sx={{
                  color: typeFilter === 'Series' ? 'primary.contrastText' : 'text.primary',
                  backgroundColor: typeFilter === 'Series' ? 'primary.main' : 'background.paper',
                  borderColor: 'divider',
                  '&:hover': {
                    backgroundColor: typeFilter === 'Series' ? 'primary.dark' : 'action.hover',
                  },
                }}
                variant={typeFilter === 'Series' ? 'filled' : 'outlined'}
              />
            </Stack>
          </Box>

          {showAnalytics && <AnalyticsPanel />}
        </Box>

        {viewMode === 'gallery' ? (
          <Box sx={{ width: '100%', bgcolor: darkMode ? '#23272f' : '#ffffff', borderRadius: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.12)', p: 2 }}>
            <Grid container spacing={2}>
              {filteredNfts.map((nft, index) => (
                <Grid item xs={6} sm={4} md={3} lg={2} key={index}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': {
                        transform: 'scale(1.02)',
                        transition: 'transform 0.2s ease-in-out'
                      }
                    }}
                  >
                    <Link 
                      href={nft.Link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      sx={{ textDecoration: 'none', height: '100%' }}
                    >
                      <Box sx={{ position: 'relative', paddingTop: '100%', height: '100%' }}>
                        <ImageWithFallback
                          nft={nft}
                          style={{ 
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                        {/* OpenSea Events Button Overlay */}
                        {nft['Contract Hash'] && nft['TokenID Start'] && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              zIndex: 2,
                              bgcolor: 'rgba(0,0,0,0.7)',
                              borderRadius: '50%',
                              p: 0.5
                            }}
                          >
                            <NFTEventButton
                              contractAddress={nft['Contract Hash']}
                              tokenId={nft['TokenID Start']}
                              nftTitle={nft['Artwork Title']}
                            />
                          </Box>
                        )}
                      </Box>
                    </Link>
                    {/* Card Actions */}
                    <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', flex: 1 }}>
                        {nft['Artwork Title']}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {nft['Contract Hash'] && nft['TokenID Start'] && (
                          <Tooltip title="View Market Data">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleNFTDashboardOpen(nft);
                              }}
                            >
                              <TrendingUpIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="View on OpenSea">
                          <IconButton
                            size="small"
                            href={nft.Link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        ) : (
          <Box sx={{ width: '100%', overflowX: 'auto', bgcolor: 'background.paper', borderRadius: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>
            <Box sx={{ minWidth: 800 }}>
              {/* Header Row */}
              <Grid container sx={{ 
                py: 1, 
                borderBottom: 1, 
                borderColor: 'divider',
                bgcolor: 'background.paper',
                position: 'sticky',
                top: 0,
                zIndex: 1
              }}>
                <Grid item xs={1}>
                  <Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 600 }}>Image</Typography>
                </Grid>
                <Grid item xs={2}>
                  <Box 
                    onClick={() => handleColumnClick('Artwork Title')}
                    sx={{ 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      '&:hover': { opacity: 0.8 }
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 600 }}>
                      Title {getSortIcon('Artwork Title')}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={1}>
                  <Box 
                    onClick={() => handleColumnClick('Mint Date')}
                    sx={{ 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      '&:hover': { opacity: 0.8 }
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 600 }}>
                      Date {getSortIcon('Mint Date')}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={1}>
                  <Box 
                    onClick={() => handleColumnClick('Type')}
                    sx={{ 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      '&:hover': { opacity: 0.8 }
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 600 }}>
                      Type {getSortIcon('Type')}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={1}>
                  <Box 
                    onClick={() => handleColumnClick('Edt Size')}
                    sx={{ 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      '&:hover': { opacity: 0.8 }
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 600 }}>
                      Edition Size {getSortIcon('Edt Size')}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={2}>
                  <Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 600 }}>Platform</Typography>
                </Grid>
                <Grid item xs={2}>
                  <Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 600 }}>Collaborator/Special Type</Typography>
                </Grid>
                <Grid item xs={1}>
                  <Box 
                    onClick={() => handleColumnClick('Price')}
                    sx={{ 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      '&:hover': { opacity: 0.8 }
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 600 }}>
                      Price {getSortIcon('Price')}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={1}>
                  <Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 600 }}>Link</Typography>
                </Grid>
                <Grid item xs={1}>
                  <Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 600 }}>Events</Typography>
                </Grid>
              </Grid>
              
              {/* Data Rows */}
              {filteredNfts.map((nft, index) => (
                <Grid container key={index} sx={{ 
                  py: 1, 
                  borderBottom: 1, 
                  borderColor: 'divider',
                  bgcolor: darkMode ? 'grey.900' : 'background.paper',
                  '&:hover': { bgcolor: darkMode ? 'grey.800' : 'action.hover' }
                }}>
                  <Grid item xs={1}>
                    <Link 
                      href={nft.Link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      sx={{ display: 'block', width: 60, height: 60 }}
                    >
                      <ImageWithFallback
                        nft={nft}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover',
                          borderRadius: '4px'
                        }}
                      />
                    </Link>
                  </Grid>
                  <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ color: 'text.primary' }}>
                      {nft['Artwork Title'] || 'Untitled'}
                    </Typography>
                  </Grid>
                  <Grid item xs={1} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {nft['Mint Date']}
                    </Typography>
                  </Grid>
                  <Grid item xs={1} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {nft.Type}
                    </Typography>
                  </Grid>
                  <Grid item xs={1} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {nft['Edt Size']}
                    </Typography>
                  </Grid>
                  <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {nft['Platform']}
                    </Typography>
                  </Grid>
                  <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {nft['Collaborator/Special Type']}
                    </Typography>
                  </Grid>
                  <Grid item xs={1} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {prices[`${nft['Contract Hash']}-${nft['TokenID Start']}`] || (isPriceLoading ? 'Loading...' : 'N/A')}
                    </Typography>
                  </Grid>
                  <Grid item xs={1} sx={{ display: 'flex', alignItems: 'center' }}>
                    {nft.Link && (
                      <Link 
                        href={nft.Link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        sx={{ 
                          color: '#1976d2',
                          '&:hover': {
                            color: '#1565c0',
                          },
                        }}
                      >
                        View
                      </Link>
                    )}
                  </Grid>
                  <Grid item xs={1} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {nft['Contract Hash'] && nft['TokenID Start'] ? (
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View Market Data">
                          <IconButton
                            size="small"
                            onClick={() => handleNFTDashboardOpen(nft)}
                          >
                            <TrendingUpIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <NFTEventButton
                          contractAddress={nft['Contract Hash']}
                          tokenId={nft['TokenID Start']}
                          nftTitle={nft['Artwork Title']}
                        />
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        N/A
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              ))}
            </Box>
          </Box>
        )}

        {/* OpenSea API Integration Dialogs */}
        {selectedNFT && showNFTDashboard && (
          <NFTDashboard
            nft={selectedNFT}
            onClose={handleNFTDashboardClose}
          />
        )}

        {selectedNFTForEvents && showOpenSeaEvents && (
          <Dialog
            open={showOpenSeaEvents}
            onClose={handleOpenSeaEventsClose}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">
                  OpenSea Events - {selectedNFTForEvents['Artwork Title']}
                </Typography>
                <IconButton
                  href={selectedNFTForEvents.Link}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                >
                  <OpenInNewIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <OpenSeaEvents
                contractAddress={selectedNFTForEvents['Contract Hash']}
                tokenId={selectedNFTForEvents['TokenID Start']}
                nftTitle={selectedNFTForEvents['Artwork Title']}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleOpenSeaEventsClose}>Close</Button>
            </DialogActions>
          </Dialog>
        )}
      </Container>
    </ThemeProvider>
  );
}

export default App; 