export default async function handler(req, res) {
  const league = req.query.league || 'eng.1'; // default to Premier League
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch ESPN data');
    const data = await response.json();

    res.setHeader('Access-Control-Allow-Origin', '*');
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
}
