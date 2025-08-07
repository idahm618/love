// Remove: const fetch = require('node-fetch');

const LEAGUES = [
  'eng.1', 'esp.1', 'ita.1', 'ger.1', 'fra.1',
  'eng.3', 'ned.1', 'por.1', 'eng.2', 'bra.1',
  'arg.copa_lpf', 'uefa.europa_qual', 'uefa.champions_qual', 'fifa.worldq.conmebol', 'fifa.worldq.afc',
  'ind.1', 'uefa.nations', 'uefa.champions', 'uefa.europa', 'uefa.conference_qual',
  'fifa.world', 'conmebol.libertadores', 'nga.1', 'caf.nations',
  'uefa.europa.conf', 'afc.cup', 'fifa.Worldq.caf', 'afc.champions', 'club.friendly',
  'idn.1', 'ksa.1', 'saf.1', 'zim.1',
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
