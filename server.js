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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
}); 