// Remove: const fetch = require('node-fetch');

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
    const leagueFilter = req.query.league;

    const fetchLeague = async (leagueId) => {
      const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueId}/scoreboard`;
      const response = await fetch(url);  // Use global fetch
      if (!response.ok) throw new Error(`Failed to fetch ${leagueId}`);
      return response.json();
    };

    const leaguesToFetch = leagueFilter && LEAGUES.includes(leagueFilter)
      ? [leagueFilter]
      : LEAGUES;

    const results = await Promise.allSettled(leaguesToFetch.map(fetchLeague));

    const allEvents = results.reduce((acc, result) => {
      if (result.status === 'fulfilled' && result.value?.events) {
        acc.push(...result.value.events);
      }
      return acc;
    }, []);

    allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
