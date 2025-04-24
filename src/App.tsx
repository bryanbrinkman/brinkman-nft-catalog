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
}

type SortField = 'Collection Name' | 'Mint Date' | 'Platform' | 'Type';
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
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(12);
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
      
      // String comparison for other fields
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredNfts(filtered);
    setPage(1); // Reset to first page when filters change
  }, [searchTerm, platformFilter, typeFilter, collaboratorFilter, nfts, sortField, sortOrder]);

  const platforms = [...new Set(nfts.map(nft => nft.Platform))].filter(Boolean);
  const types = [...new Set(nfts.map(nft => nft.Type))].filter(Boolean);
  const collaborators = [...new Set(nfts.map(nft => nft['Collaborator/Special Type']))].filter(Boolean);

  const getImageUrl = (nft: NFT) => {
    if (nft['IPFS Image']) {
      // Remove any leading/trailing whitespace and ensure proper IPFS gateway URL
      const ipfsHash = nft['IPFS Image'].trim();
      return `https://ipfs.io/ipfs/${ipfsHash}`;
    }
    return 'https://via.placeholder.com/300x300?text=No+Image';
  };

  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo(0, 0);
  };

  const paginatedNfts = filteredNfts.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const pageCount = Math.ceil(filteredNfts.length / itemsPerPage);

  const clearFilters = () => {
    setSearchTerm('');
    setPlatformFilter('');
    setTypeFilter('');
    setCollaboratorFilter('');
    setSortField('Mint Date');
    setSortOrder('desc');
  };

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
              <Grid item xs={3}>
                <Typography variant="subtitle2" sx={{ color: 'rgba(0, 0, 0, 0.87)', fontWeight: 600 }}>Title</Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="subtitle2" sx={{ color: 'rgba(0, 0, 0, 0.87)', fontWeight: 600 }}>Date</Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="subtitle2" sx={{ color: 'rgba(0, 0, 0, 0.87)', fontWeight: 600 }}>Type</Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="subtitle2" sx={{ color: 'rgba(0, 0, 0, 0.87)', fontWeight: 600 }}>Edition Size</Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="subtitle2" sx={{ color: 'rgba(0, 0, 0, 0.87)', fontWeight: 600 }}>Link</Typography>
              </Grid>
            </Grid>
            
            {/* Data Rows */}
            {paginatedNfts.map((nft, index) => (
              <Grid container key={index} sx={{ 
                py: 1, 
                borderBottom: 1, 
                borderColor: 'rgba(0, 0, 0, 0.12)',
                bgcolor: '#ffffff',
                '&:hover': { bgcolor: '#f5f5f5' }
              }}>
                <Grid item xs={1}>
                  <Box sx={{ width: 60, height: 60 }}>
                    <img
                      src={getImageUrl(nft)}
                      alt={nft['Collection Name'] || nft.Type || 'NFT'}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        borderRadius: '4px'
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={3} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body1" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                    {nft['Artwork Title'] || 'Untitled'}
                  </Typography>
                </Grid>
                <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                    {nft['Mint Date']}
                  </Typography>
                </Grid>
                <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                    {nft.Type}
                  </Typography>
                </Grid>
                <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                    {nft['Edt Size']}
                  </Typography>
                </Grid>
                <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center' }}>
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
          {filteredNfts.slice((page - 1) * itemsPerPage, page * itemsPerPage).map((nft, index) => (
            <ListItem key={index} divider sx={{ borderColor: 'rgba(0, 0, 0, 0.12)' }}>
              <Grid container alignItems="center">
                <Grid item xs={2}>
                  <img 
                    src={getImageUrl(nft)} 
                    alt={nft['Artwork Title']} 
                    style={{ width: '100%', height: 'auto' }} 
                  />
                </Grid>
                <Grid item xs={3}>
                  <Typography sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>{nft['Artwork Title']}</Typography>
                </Grid>
                <Grid item xs={2}>
                  <Typography sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>{nft['Mint Date']}</Typography>
                </Grid>
                <Grid item xs={2}>
                  <Typography sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>{nft['Type']}</Typography>
                </Grid>
                <Grid item xs={2}>
                  <Typography sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>{nft['Edt Size']}</Typography>
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

      {pageCount > 1 && (
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Pagination 
            count={pageCount} 
            page={page} 
            onChange={handlePageChange} 
            sx={{
              '& .MuiPaginationItem-root': {
                color: 'rgba(0, 0, 0, 0.87)',
              },
              '& .Mui-selected': {
                backgroundColor: '#1976d2 !important',
                color: '#ffffff',
              },
            }}
          />
        </Box>
      )}
    </Container>
  );
}

export default App; 