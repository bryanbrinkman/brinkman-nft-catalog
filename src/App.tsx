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
  CssBaseline
} from '@mui/material';
import { 
  FilterList as FilterIcon,
  ViewList as GridIcon,
  ViewComfy as GalleryIcon,
  Search as SearchIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon
} from '@mui/icons-material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Papa from 'papaparse';
import 'react-lazy-load-image-component/src/effects/blur.css';
import Masonry from 'react-masonry-css';
import { Network, Alchemy } from "alchemy-sdk";

// Add Masonry styles
const masonryStyles = {
  display: "flex",
  width: "auto",
  marginLeft: -4,
  marginRight: -4,
  "& .masonry-grid_column": {
    paddingLeft: 4,
    paddingRight: 4,
    backgroundClip: "padding-box",
    "& > *": {
      marginBottom: 0
    }
  }
};

// Helper function to delay between API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Add Alchemy settings
const alchemySettings = {
  apiKey: "5gwcGwhpJmXp-nH6tFvxQQINapw_PFZL",
  network: Network.ETH_MAINNET,
};
const alchemy = new Alchemy(alchemySettings);

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
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

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
    fetch(`${process.env.PUBLIC_URL}/Brinkman NFT Catalog - Sheet1 (10).csv`)
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
      })
      .catch(error => {
        console.error('Error loading CSV:', error);
        setLoading(false);
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
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';
      
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
  }, [searchTerm, platformFilter, typeFilter, collaboratorFilter, nfts, sortField, sortOrder]);

  const platforms = [...new Set(nfts.map(nft => nft.Platform))].filter(Boolean);
  const types = [...new Set(nfts.map(nft => nft.Type))].filter(Boolean);
  const collaborators = [...new Set(nfts.map(nft => nft['Collaborator/Special Type']))].filter(Boolean);

  const getImageUrl = async (nft: NFT): Promise<string> => {
    // First try the direct image link if available
    if (nft['Image link']) {
      try {
        // Skip the HEAD request and just return the image link directly
        return nft['Image link'];
      } catch (error) {
        console.warn('Error with direct image link for:', nft['Artwork Title'], error);
      }
    }

    // Try IPFS if available
    if (nft['IPFS Image']) {
      try {
        const ipfsHash = nft['IPFS Image'].trim();
        // Remove 'ipfs://' if present and any trailing slashes
        const cleanHash = ipfsHash.replace('ipfs://', '').replace(/\/+$/, '');
        
        // Use a reliable IPFS gateway
        return `https://nftstorage.link/ipfs/${cleanHash}`;
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
      return nft.Link;
    }

    // Fallback to placeholder
    console.warn('No valid image found for:', nft['Artwork Title']);
    return 'https://via.placeholder.com/300x300?text=No+Image';
  };

  // Update ImageWithFallback component to handle async image URL
  const ImageWithFallback = ({ nft, style }: { nft: NFT, style: React.CSSProperties }) => {
    const [currentSrc, setCurrentSrc] = useState<string>('https://via.placeholder.com/300x300?text=Loading...');
    const [errorCount, setErrorCount] = useState(0);
    const maxRetries = 3;
    
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
    }, [nft]);

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

  // Updated price fetching function using Alchemy
  const fetchOpenSeaPrice = useCallback(async (contractAddress: string, tokenIdStart: string): Promise<string> => {
    try {
      // Skip price fetching for SuperRare pieces
      if (contractAddress.toLowerCase() === "0xb932a70a57673d89f4acffbe830e8ed7f75fb9e0") {
        return 'N/A';
      }

      await delay(100); // Rate limiting delay
      
      console.log('Fetching price for:', contractAddress, tokenIdStart);
      
      // Get NFT metadata from Alchemy
      const nft = await alchemy.nft.getNftMetadata(contractAddress, tokenIdStart);
      
      if (!nft) {
        console.warn('No NFT metadata found for:', contractAddress, tokenIdStart);
        return 'Not Listed';
      }

      // Get floor price from Alchemy
      const floorPrice = await alchemy.nft.getFloorPrice(contractAddress);
      console.log('Floor price response:', floorPrice);
      
      if (floorPrice && 
          'openSea' in floorPrice && 
          floorPrice.openSea && 
          typeof floorPrice.openSea === 'object' &&
          'floorPrice' in floorPrice.openSea) {
        const price = floorPrice.openSea.floorPrice;
        console.log('Found price:', price);
        return `${price} ETH (Floor)`;
      }

      console.log('No floor price found');
      return 'Not Listed';
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
    
    const updatedNfts = [...nfts];
    let hasChanges = false;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < nfts.length; i++) {
      const nft = nfts[i];
      if (nft['Contract Hash'] && nft['TokenID Start']) {
        try {
          console.log('Processing NFT:', nft['Artwork Title'], nft['Contract Hash'], nft['TokenID Start']);
          const price = await fetchOpenSeaPrice(
            nft['Contract Hash'], 
            nft['TokenID Start']
          );
          if (price !== 'Error') {
            updatedNfts[i] = { ...nft, Price: price };
            hasChanges = true;
            successCount++;
            console.log('Updated price for:', nft['Artwork Title'], price);
          } else {
            errorCount++;
            console.log('Failed to get price for:', nft['Artwork Title']);
          }
        } catch (error) {
          console.error('Error updating price for:', nft['Artwork Title'], error);
          errorCount++;
        }
      }
    }

    if (hasChanges) {
      console.log(`Price update complete. Success: ${successCount}, Errors: ${errorCount}`);
      setNfts(updatedNfts);
    } else {
      console.log('No price updates were made');
    }
    
    setIsPriceLoading(false);
  }, [nfts, fetchOpenSeaPrice, isPriceLoading]);

  // Set up periodic price refresh
  useEffect(() => {
    // Initial price fetch
    console.log('Starting initial price fetch');
    fetchAllPrices();

    // Set up interval for periodic updates
    const interval = setInterval(() => {
      console.log('Starting periodic price update');
      fetchAllPrices();
    }, 5 * 60 * 1000); // Update every 5 minutes

    return () => clearInterval(interval);
  }, [fetchAllPrices]);

  const breakpointColumns = {
    default: 8,
    2400: 7,
    2000: 6,
    1600: 5,
    1200: 4,
    900: 3,
    600: 2,
    400: 1
  };

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
          <Box sx={{ mb: 2, width: '150px', height: 'auto' }}>
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
            </Box>
            <Stack direction="row" spacing={1}>
              <Chip 
                label="Unique" 
                onClick={() => setTypeFilter(typeFilter === 'Unique' ? '' : 'Unique')}
                sx={{
                  color: typeFilter === 'Unique' ? '#fff' : '#f2668b',
                  backgroundColor: typeFilter === 'Unique' ? '#f2668b' : 'transparent',
                  borderColor: '#f2668b',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: typeFilter === 'Unique' ? '#f2668b' : 'rgba(242, 102, 139, 0.15)',
                    transform: 'scale(1.05)'
                  },
                }}
                variant={typeFilter === 'Unique' ? 'filled' : 'outlined'}
              />
              <Chip 
                label="Edition" 
                onClick={() => setTypeFilter(typeFilter === 'Edition' ? '' : 'Edition')}
                sx={{
                  color: typeFilter === 'Edition' ? '#fff' : '#23c7d9',
                  backgroundColor: typeFilter === 'Edition' ? '#23c7d9' : 'transparent',
                  borderColor: '#23c7d9',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: typeFilter === 'Edition' ? '#23c7d9' : 'rgba(35, 199, 217, 0.15)',
                    transform: 'scale(1.05)'
                  },
                }}
                variant={typeFilter === 'Edition' ? 'filled' : 'outlined'}
              />
              <Chip 
                label="Generative" 
                onClick={() => setTypeFilter(typeFilter === 'Generative' ? '' : 'Generative')}
                sx={{
                  color: typeFilter === 'Generative' ? '#fff' : '#48d9a4',
                  backgroundColor: typeFilter === 'Generative' ? '#48d9a4' : 'transparent',
                  borderColor: '#48d9a4',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: typeFilter === 'Generative' ? '#48d9a4' : 'rgba(72, 217, 164, 0.15)',
                    transform: 'scale(1.05)'
                  },
                }}
                variant={typeFilter === 'Generative' ? 'filled' : 'outlined'}
              />
              <Chip 
                label="Series" 
                onClick={() => setTypeFilter(typeFilter === 'Series' ? '' : 'Series')}
                sx={{
                  color: typeFilter === 'Series' ? '#fff' : '#f2bf27',
                  backgroundColor: typeFilter === 'Series' ? '#f2bf27' : 'transparent',
                  borderColor: '#f2bf27',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: typeFilter === 'Series' ? '#f2bf27' : 'rgba(242, 191, 39, 0.15)',
                    transform: 'scale(1.05)'
                  },
                }}
                variant={typeFilter === 'Series' ? 'filled' : 'outlined'}
              />
            </Stack>
          </Box>
        </Box>

        {viewMode === 'gallery' ? (
          <Masonry
            breakpointCols={breakpointColumns}
            className="masonry-grid"
            columnClassName="masonry-grid_column"
            style={masonryStyles}
          >
            {filteredNfts.map((nft) => (
              <Link 
                key={nft['Artwork Title']}
                href={nft.Link} 
                target="_blank" 
                rel="noopener noreferrer"
                sx={{ 
                  display: 'block',
                  mb: 0,
                  overflow: 'hidden',
                  borderRadius: 0,
                  transition: 'transform 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'scale(1.02)',
                  }
                }}
              >
                <Box sx={{ 
                  position: 'relative', 
                  paddingTop: '100%', 
                  overflow: 'hidden',
                  backgroundColor: darkMode ? 'grey.900' : 'grey.100'
                }}>
                  <ImageWithFallback
                    nft={nft}
                    style={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.3s ease-in-out'
                    }}
                  />
                </Box>
              </Link>
            ))}
          </Masonry>
        ) : (
          <Box sx={{ 
            width: '100%', 
            overflowX: 'auto', 
            bgcolor: 'background.paper', 
            borderRadius: 2,
            boxShadow: darkMode 
              ? '0 4px 12px rgba(0,0,0,0.2)' 
              : '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            <Box sx={{ minWidth: 800 }}>
              {/* Header Row */}
              <Grid container sx={{ 
                py: 2, 
                px: 2,
                borderBottom: 1, 
                borderColor: 'divider',
                bgcolor: darkMode ? 'grey.900' : 'grey.50',
                position: 'sticky',
                top: 0,
                zIndex: 1
              }}>
                <Grid item xs={1}>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600 }}>Image</Typography>
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
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
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
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
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
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
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
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      Edition Size {getSortIcon('Edt Size')}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={2}>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600 }}>Platform</Typography>
                </Grid>
                <Grid item xs={2}>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600 }}>Collaborator/Special Type</Typography>
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
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      Price {getSortIcon('Price')}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={1}>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600 }}>Link</Typography>
                </Grid>
              </Grid>
              
              {/* Data Rows */}
              {filteredNfts.map((nft, index) => (
                <Grid container key={index} sx={{ 
                  py: 1.5, 
                  px: 2,
                  borderBottom: 1, 
                  borderColor: 'divider',
                  bgcolor: darkMode ? 'grey.900' : 'background.paper',
                  '&:hover': { 
                    bgcolor: darkMode ? 'grey.800' : 'grey.50',
                    transition: 'background-color 0.2s ease'
                  }
                }}>
                  <Grid item xs={1}>
                    <Link 
                      href={nft.Link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      sx={{ 
                        display: 'block', 
                        width: 60, 
                        height: 60,
                        borderRadius: 1,
                        overflow: 'hidden',
                        transition: 'transform 0.2s ease',
                        '&:hover': {
                          transform: 'scale(1.05)'
                        }
                      }}
                    >
                      <ImageWithFallback
                        nft={nft}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover'
                        }}
                      />
                    </Link>
                  </Grid>
                  <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: 'text.primary',
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {nft['Artwork Title'] || 'Untitled'}
                    </Typography>
                  </Grid>
                  <Grid item xs={1} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {nft['Mint Date']}
                    </Typography>
                  </Grid>
                  <Grid item xs={1} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Chip 
                      label={nft.Type} 
                      size="small"
                      sx={{ 
                        color: nft.Type === 'Unique' ? '#fff' : 
                               nft.Type === 'Edition' ? '#fff' : 
                               nft.Type === 'Generative' ? '#fff' : 
                               nft.Type === 'Series' ? '#fff' : 'text.primary',
                        backgroundColor: nft.Type === 'Unique' ? '#f2668b' : 
                                       nft.Type === 'Edition' ? '#23c7d9' : 
                                       nft.Type === 'Generative' ? '#48d9a4' : 
                                       nft.Type === 'Series' ? '#f2bf27' : 
                                       darkMode ? 'grey.800' : 'grey.100',
                        borderColor: nft.Type === 'Unique' ? '#f2668b' : 
                                   nft.Type === 'Edition' ? '#23c7d9' : 
                                   nft.Type === 'Generative' ? '#48d9a4' : 
                                   nft.Type === 'Series' ? '#f2bf27' : 'divider',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'scale(1.05)',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={1} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {nft['Edt Size']}
                    </Typography>
                  </Grid>
                  <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {nft['Platform']}
                    </Typography>
                  </Grid>
                  <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {nft['Collaborator/Special Type']}
                    </Typography>
                  </Grid>
                  <Grid item xs={1} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: nft.Price ? 'success.main' : 'text.secondary',
                        fontWeight: nft.Price ? 500 : 400
                      }}
                    >
                      {nft.Price || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={1} sx={{ display: 'flex', alignItems: 'center' }}>
                    {nft.Link && (
                      <Link 
                        href={nft.Link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        sx={{ 
                          color: 'primary.main',
                          textDecoration: 'none',
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        View
                      </Link>
                    )}
                  </Grid>
                </Grid>
              ))}
            </Box>
          </Box>
        )}
      </Container>
    </ThemeProvider>
  );
}

export default App; 