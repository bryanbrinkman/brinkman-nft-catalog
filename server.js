const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
app.use(cors());

app.get('/api/price/:contractAddress/:tokenId', async (req, res) => {
  try {
    const { contractAddress, tokenId } = req.params;
    const response = await fetch(
      `https://api.opensea.io/api/v1/asset/${contractAddress}/${tokenId}/?include_orders=true`,
      {
        headers: {
          'X-API-KEY': process.env.REACT_APP_OPENSEA_API_KEY,
          'accept': 'application/json'
        }
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching from OpenSea:', error);
    res.status(500).json({ error: 'Failed to fetch price data' });
  }
});

// New endpoint for fetching NFT events
app.get('/api/events/:contractAddress/:tokenId', async (req, res) => {
  try {
    const { contractAddress, tokenId } = req.params;
    const { event_type, occurred_after, occurred_before, cursor } = req.query;
    
    let url = `https://api.opensea.io/api/v2/events/chain/ethereum/contract/${contractAddress}/nfts/${tokenId}`;
    
    // Add query parameters if provided
    const params = new URLSearchParams();
    if (event_type) params.append('event_type', event_type);
    if (occurred_after) params.append('occurred_after', occurred_after);
    if (occurred_before) params.append('occurred_before', occurred_before);
    if (cursor) params.append('cursor', cursor);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      headers: {
        'X-API-KEY': process.env.REACT_APP_OPENSEA_API_KEY,
        'accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`OpenSea API responded with status: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching NFT events from OpenSea:', error);
    res.status(500).json({ error: 'Failed to fetch NFT events' });
  }
});

// Endpoint to get all events for a collection
app.get('/api/collection-events/:contractAddress', async (req, res) => {
  try {
    const { contractAddress } = req.params;
    const { event_type, occurred_after, occurred_before, cursor, limit = 50 } = req.query;
    
    let url = `https://api.opensea.io/api/v2/events/chain/ethereum/contract/${contractAddress}`;
    
    // Add query parameters if provided
    const params = new URLSearchParams();
    if (event_type) params.append('event_type', event_type);
    if (occurred_after) params.append('occurred_after', occurred_after);
    if (occurred_before) params.append('occurred_before', occurred_before);
    if (cursor) params.append('cursor', cursor);
    if (limit) params.append('limit', limit);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      headers: {
        'X-API-KEY': process.env.REACT_APP_OPENSEA_API_KEY,
        'accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`OpenSea API responded with status: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching collection events from OpenSea:', error);
    res.status(500).json({ error: 'Failed to fetch collection events' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
}); 