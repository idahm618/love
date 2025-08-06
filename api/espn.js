const fetch = require('node-fetch');

const LEAGUES = [
  'eng.1', 'esp.1', 'ita.1', 'ger.1', 'fra.1',
  'usa.1', 'ned.1', 'por.1', 'eng.2', 'bra.1',
  'arg.1', 'tur.1', 'rus.1', 'jpn.1', 'kor.1',
  'mex.1', 'ccl.1', 'uefa.champions', 'uefa.europa', 'uefa.euro',
  'fifa.world', 'conmebol.libertadores', 'conmebol.america', 'caf.nations',
  'aus.1', 'bel.1', 'sco.1', 'gre.1', 'nor.1',
  'dnk.1', 'swc.1', 'cze.1', 'aut.1',
];

module.exports = async (req, res) => {
  try {
    // Optional: get league param from query string to filter by single league (for future)
    const leagueFilter = req.query.league;

    // Function to fetch data for one league
    const fetchLeague = async (leagueId) => {
      const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueId}/scoreboard`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ${leagueId}`);
      return response.json();
    };

    // Select leagues to fetch
    const leaguesToFetch = leagueFilter && LEAGUES.includes(leagueFilter)
      ? [leagueFilter]
      : LEAGUES;

    // Fetch all league data in parallel with Promise.allSettled to avoid failing all if one fails
    const results = await Promise.allSettled(leaguesToFetch.map(fetchLeague));

    // Extract successful events
    const allEvents = results.reduce((acc, result) => {
      if (result.status === 'fulfilled' && result.value?.events) {
        acc.push(...result.value.events);
      }
      return acc;
    }, []);

    // Sort events by date ascending
    allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Set CORS headers to allow your Blogger or other clients
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    res.status(200).json({
      success: true,
      totalLeagues: leaguesToFetch.length,
      totalMatches: allEvents.length,
      events: allEvents,
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
