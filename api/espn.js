const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const ESPN_API_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard';

  try {
    const response = await fetch(ESPN_API_URL);
    if (!response.ok) throw new Error('Failed to fetch ESPN data');
    const data = await response.json();

    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins (for Blogger)
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
