// ✅ ESPN Soccer Proxy API

const LEAGUES = [
  'eng.1', 'esp.1', 'ita.1', 'ger.1', 'fra.1',
  'eng.3', 'ned.1', 'por.1', 'eng.2', 'bra.1',
  'arg.copa_lpf', 'uefa.europa_qual', 'uefa.champions_qual', 'fifa.worldq.conmebol', 'fifa.worldq.afc',
  'ind.1', 'uefa.nations', 'uefa.champions', 'uefa.europa', 'uefa.conference_qual',
  'fifa.world', 'conmebol.libertadores', 'nga.1', 'caf.nations',
  'uefa.europa.conf', 'afc.cup', 'fifa.Worldq.caf', 'afc.champions', 'club.friendly',
  'idn.1', 'ksa.1', 'rsa.1', 'zim.1', 'eng.league_cup', 'uefa.super_cup', 'concacaf.leagues.cup', 'usa.1', 'mex.1',
];

const BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer";

module.exports = async (req, res) => {
  try {
    const { league, id, type } = req.query;

    let data;

    if (id && league) {
      // ✅ Fetch specific match summary
      const url = `${BASE}/${league}/summary?event=${id}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch match ${id}`);
      data = await response.json();

      // If ?type= is passed, return only that section
      if (type && data[type]) {
        data = data[type];
      }

    } else {
      // ✅ Fetch ALL fixtures across all leagues if no league specified
      const leaguesToFetch = league && LEAGUES.includes(league)
        ? [league]
        : LEAGUES;

      const fetchLeague = async (leagueId) => {
        const url = `${BASE}/${leagueId}/scoreboard`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch ${leagueId}`);
        return response.json();
      };

      const results = await Promise.allSettled(leaguesToFetch.map(fetchLeague));

      const allEvents = results.reduce((acc, result) => {
        if (result.status === 'fulfilled' && result.value?.events) {
          acc.push(...result.value.events);
        }
        return acc;
      }, []);

      allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

      data = {
        success: true,
        totalLeagues: leaguesToFetch.length,
        totalMatches: allEvents.length,
        events: allEvents,
      };
    }

    // ✅ Allow all CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");

    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }

    res.status(200).json(data);

  } catch (error) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(500).json({ success: false, error: error.message });
  }
};
