import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Typography, 
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  CircularProgress,
  Pagination,
  SelectChangeEvent,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Divider,
  Link,
  List,
  ListItem
} from '@mui/material';
import { 
  Sort as SortIcon, 
  FilterList as FilterIcon,
  ViewModule as GridIcon,
  ViewList as ListIcon
} from '@mui/icons-material';
import Papa from 'papaparse';

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
  'Price'?: string; // Optional price field
}

type SortField = 'Artwork Title' | 'Mint Date' | 'Type' | 'Edt Size' | 'Platform' | 'Collaborator/Special Type' | 'Price';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

function App() {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [filteredNfts, setFilteredNfts] = useState<NFT[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [collaboratorFilter, setCollaboratorFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('Mint Date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Load CSV data
    fetch('./Brinkman NFT Catalog - Sheet1 (4).csv')
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
    // First try OpenSea API if we have contract and token info
    if (nft['Contract Hash'] && nft['TokenID Start']) {
      try {
        const response = await fetch(
          `https://api.opensea.io/api/v2/chain/ethereum/contract/${nft['Contract Hash']}/nfts/${nft['TokenID Start']}`,
          {
            headers: {
              'X-API-KEY': process.env.REACT_APP_OPENSEA_API_KEY || '',
              'Accept': 'application/json'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.nft && data.nft.image_url) {
            return data.nft.image_url;
          }
        }
      } catch (error) {
        console.error('Error fetching from OpenSea:', error);
      }
    }

    // If OpenSea fails or isn't available, try IPFS
    if (nft['IPFS Image']) {
      const ipfsHash = nft['IPFS Image'].trim();
      const gateways = [
        'https://ipfs.io/ipfs/',
        'https://cloudflare-ipfs.com/ipfs/',
        'https://gateway.pinata.cloud/ipfs/',
        'https://dweb.link/ipfs/',
        'https://gateway.ipfs.io/ipfs/'
      ];
      
      // Use a random gateway to distribute the load
      const gateway = gateways[Math.floor(Math.random() * gateways.length)];
      return `${gateway}${ipfsHash}`;
    }

    return 'https://via.placeholder.com/300x300?text=No+Image';
  };

  // Update ImageWithFallback component to handle async image URL
  const ImageWithFallback = ({ nft, style }: { nft: NFT, style: React.CSSProperties }) => {
    const [currentSrc, setCurrentSrc] = useState<string>('https://via.placeholder.com/300x300?text=Loading...');
    const [errorCount, setErrorCount] = useState(0);
    const maxRetries = 3;
    
    useEffect(() => {
      const loadImage = async () => {
        try {
          const imageUrl = await getImageUrl(nft);
          setCurrentSrc(imageUrl);
        } catch (error) {
          console.error('Error loading image:', error);
          setCurrentSrc('https://via.placeholder.com/300x300?text=Error+Loading+Image');
        }
      };
      
      loadImage();
    }, [nft]);

    const handleError = async () => {
      if (errorCount < maxRetries) {
        setErrorCount(prev => prev + 1);
        // Try getting a new URL on error
        const newUrl = await getImageUrl(nft);
        setCurrentSrc(newUrl);
      } else {
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

  // Add price fetching function
  const fetchOpenSeaPrice = async (contractAddress: string, tokenId: string): Promise<string> => {
    try {
      const response = await fetch(
        `https://api.opensea.io/api/v2/chain/ethereum/contract/${contractAddress}/nfts/${tokenId}/listings`,
        {
          headers: {
            'X-API-KEY': process.env.REACT_APP_OPENSEA_API_KEY || '', // API key should be in .env file
            'Accept': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        console.error('OpenSea API error:', await response.text());
        return 'N/A';
      }

      const data = await response.json();
      if (data.listings && data.listings.length > 0) {
        // Get the lowest price listing
        const lowestPriceListing = data.listings.reduce((lowest: any, current: any) => {
          const currentPrice = parseFloat(current.price.current.value);
          return !lowest || currentPrice < parseFloat(lowest.price.current.value) ? current : lowest;
        }, null);

        if (lowestPriceListing) {
          return `${lowestPriceListing.price.current.value} ${lowestPriceListing.price.current.currency}`;
        }
      }
      return 'Not Listed';
    } catch (error) {
      console.error('Error fetching OpenSea price:', error);
      return 'N/A';
    }
  };

  // Add useEffect to fetch prices
  useEffect(() => {
    const fetchPrices = async () => {
      const updatedNfts = await Promise.all(
        nfts.map(async (nft) => {
          if (nft['Contract Hash'] && nft['TokenID Start']) {
            const price = await fetchOpenSeaPrice(nft['Contract Hash'], nft['TokenID Start']);
            return { ...nft, Price: price };
          }
          return { ...nft, Price: 'N/A' };
        })
      );
      setNfts(updatedNfts);
    };

    if (nfts.length > 0) {
      fetchPrices();
    }
  }, [nfts.length]); // Only run when nfts array length changes

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, bgcolor: '#f5f5f5' }}>
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
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
          </Grid>
          <Grid item xs={12} md={6}>
            <Box display="flex" justifyContent="flex-end" gap={1}>
              <Tooltip title="Toggle Filters">
                <IconButton 
                  onClick={() => setShowFilters(!showFilters)} 
                  sx={{ color: 'rgba(0, 0, 0, 0.87)' }}
                >
                  <FilterIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Grid View">
                <IconButton 
                  onClick={() => setViewMode('grid')} 
                  sx={{ color: viewMode === 'grid' ? '#1976d2' : 'rgba(0, 0, 0, 0.87)' }}
                >
                  <GridIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="List View">
                <IconButton 
                  onClick={() => setViewMode('list')} 
                  sx={{ color: viewMode === 'list' ? '#1976d2' : 'rgba(0, 0, 0, 0.87)' }}
                >
                  <ListIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>

        {showFilters && (
          <Box sx={{ mt: 2, p: 2, bgcolor: '#ffffff', borderRadius: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>
            <Grid container spacing={2}>
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

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            Showing {filteredNfts.length} NFTs
          </Typography>
          <Stack direction="row" spacing={1}>
            <Chip 
              label="Unique" 
              onClick={() => setTypeFilter(typeFilter === 'Unique' ? '' : 'Unique')}
              sx={{
                color: typeFilter === 'Unique' ? '#ffffff' : 'rgba(0, 0, 0, 0.87)',
                backgroundColor: typeFilter === 'Unique' ? '#1976d2' : '#ffffff',
                borderColor: 'rgba(0, 0, 0, 0.23)',
                '&:hover': {
                  backgroundColor: typeFilter === 'Unique' ? '#1565c0' : '#f5f5f5',
                },
              }}
              variant={typeFilter === 'Unique' ? 'filled' : 'outlined'}
            />
            <Chip 
              label="Edition" 
              onClick={() => setTypeFilter(typeFilter === 'Edition' ? '' : 'Edition')}
              sx={{
                color: typeFilter === 'Edition' ? '#ffffff' : 'rgba(0, 0, 0, 0.87)',
                backgroundColor: typeFilter === 'Edition' ? '#1976d2' : '#ffffff',
                borderColor: 'rgba(0, 0, 0, 0.23)',
                '&:hover': {
                  backgroundColor: typeFilter === 'Edition' ? '#1565c0' : '#f5f5f5',
                },
              }}
              variant={typeFilter === 'Edition' ? 'filled' : 'outlined'}
            />
            <Chip 
              label="Generative" 
              onClick={() => setTypeFilter(typeFilter === 'Generative' ? '' : 'Generative')}
              sx={{
                color: typeFilter === 'Generative' ? '#ffffff' : 'rgba(0, 0, 0, 0.87)',
                backgroundColor: typeFilter === 'Generative' ? '#1976d2' : '#ffffff',
                borderColor: 'rgba(0, 0, 0, 0.23)',
                '&:hover': {
                  backgroundColor: typeFilter === 'Generative' ? '#1565c0' : '#f5f5f5',
                },
              }}
              variant={typeFilter === 'Generative' ? 'filled' : 'outlined'}
            />
            <Chip 
              label="Series" 
              onClick={() => setTypeFilter(typeFilter === 'Series' ? '' : 'Series')}
              sx={{
                color: typeFilter === 'Series' ? '#ffffff' : 'rgba(0, 0, 0, 0.87)',
                backgroundColor: typeFilter === 'Series' ? '#1976d2' : '#ffffff',
                borderColor: 'rgba(0, 0, 0, 0.23)',
                '&:hover': {
                  backgroundColor: typeFilter === 'Series' ? '#1565c0' : '#f5f5f5',
                },
              }}
              variant={typeFilter === 'Series' ? 'filled' : 'outlined'}
            />
          </Stack>
        </Box>
      </Box>

      {viewMode === 'grid' ? (
        <Box sx={{ width: '100%', overflowX: 'auto', bgcolor: '#ffffff', borderRadius: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>
          <Box sx={{ minWidth: 800 }}>
            {/* Header Row */}
            <Grid container sx={{ 
              py: 1, 
              borderBottom: 1, 
              borderColor: 'rgba(0, 0, 0, 0.12)',
              bgcolor: '#ffffff',
              position: 'sticky',
              top: 0,
              zIndex: 1
            }}>
              <Grid item xs={1}>
                <Typography variant="subtitle2" sx={{ color: 'rgba(0, 0, 0, 0.87)', fontWeight: 600 }}>Image</Typography>
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
                  <Typography variant="subtitle2" sx={{ color: 'rgba(0, 0, 0, 0.87)', fontWeight: 600 }}>
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
                  <Typography variant="subtitle2" sx={{ color: 'rgba(0, 0, 0, 0.87)', fontWeight: 600 }}>
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
                  <Typography variant="subtitle2" sx={{ color: 'rgba(0, 0, 0, 0.87)', fontWeight: 600 }}>
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
                  <Typography variant="subtitle2" sx={{ color: 'rgba(0, 0, 0, 0.87)', fontWeight: 600 }}>
                    Edition Size {getSortIcon('Edt Size')}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="subtitle2" sx={{ color: 'rgba(0, 0, 0, 0.87)', fontWeight: 600 }}>Platform</Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="subtitle2" sx={{ color: 'rgba(0, 0, 0, 0.87)', fontWeight: 600 }}>Collaborator/Special Type</Typography>
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
                  <Typography variant="subtitle2" sx={{ color: 'rgba(0, 0, 0, 0.87)', fontWeight: 600 }}>
                    Price {getSortIcon('Price')}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={1}>
                <Typography variant="subtitle2" sx={{ color: 'rgba(0, 0, 0, 0.87)', fontWeight: 600 }}>Link</Typography>
              </Grid>
            </Grid>
            
            {/* Data Rows */}
            {filteredNfts.map((nft, index) => (
              <Grid container key={index} sx={{ 
                py: 1, 
                borderBottom: 1, 
                borderColor: 'rgba(0, 0, 0, 0.12)',
                bgcolor: '#ffffff',
                '&:hover': { bgcolor: '#f5f5f5' }
              }}>
                <Grid item xs={1}>
                  <Box sx={{ width: 60, height: 60 }}>
                    <ImageWithFallback
                      nft={nft}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        borderRadius: '4px'
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body1" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                    {nft['Artwork Title'] || 'Untitled'}
                  </Typography>
                </Grid>
                <Grid item xs={1} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                    {nft['Mint Date']}
                  </Typography>
                </Grid>
                <Grid item xs={1} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                    {nft.Type}
                  </Typography>
                </Grid>
                <Grid item xs={1} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                    {nft['Edt Size']}
                  </Typography>
                </Grid>
                <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                    {nft['Platform']}
                  </Typography>
                </Grid>
                <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                    {nft['Collaborator/Special Type']}
                  </Typography>
                </Grid>
                <Grid item xs={1} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
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
              </Grid>
            ))}
          </Box>
        </Box>
      ) : (
        <List sx={{ bgcolor: '#ffffff', borderRadius: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>
          {filteredNfts.map((nft, index) => (
            <ListItem key={index} divider sx={{ borderColor: 'rgba(0, 0, 0, 0.12)' }}>
              <Grid container alignItems="center">
                <Grid item xs={2}>
                  <ImageWithFallback
                    nft={nft}
                    style={{ width: '100%', height: 'auto' }}
                  />
                </Grid>
                <Grid item xs={2}>
                  <Typography sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>{nft['Artwork Title']}</Typography>
                </Grid>
                <Grid item xs={1}>
                  <Typography sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>{nft['Mint Date']}</Typography>
                </Grid>
                <Grid item xs={1}>
                  <Typography sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>{nft['Type']}</Typography>
                </Grid>
                <Grid item xs={1}>
                  <Typography sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>{nft['Edt Size']}</Typography>
                </Grid>
                <Grid item xs={2}>
                  <Typography sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>{nft['Platform']}</Typography>
                </Grid>
                <Grid item xs={1}>
                  <Typography sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>{nft['Collaborator/Special Type']}</Typography>
                </Grid>
                <Grid item xs={1}>
                  <Typography sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>{nft.Price || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={1}>
                  <Link 
                    href={nft['Link']} 
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
                </Grid>
              </Grid>
            </ListItem>
          ))}
        </List>
      )}
    </Container>
  );
}

export default App; 