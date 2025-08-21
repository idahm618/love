// pages/api/espn.js

const LEAGUES = [
  'eng.1', 'esp.1', 'ita.1', 'ger.1', 'fra.1',
  'eng.3', 'ned.1', 'por.1', 'eng.2', 'bra.1',
  'arg.copa_lpf', 'uefa.europa_qual', 'uefa.champions_qual', 'fifa.worldq.conmebol', 'fifa.worldq.afc',
  'ind.1', 'uefa.nations', 'uefa.champions', 'uefa.europa', 'uefa.conference_qual',
  'fifa.world', 'conmebol.libertadores', 'nga.1', 'caf.nations',
  'uefa.europa.conf', 'afc.cup', 'fifa.Worldq.caf', 'afc.champions', 'club.friendly',
  'idn.1', 'ksa.1', 'rsa.1', 'zim.1', 'eng.charity', 'uefa.super_cup', 'concacaf.leagues.cup', 'usa.1', 'mex.1',
];

module.exports = async (req, res) => {
  try {
    const leagueFilter = req.query.league;

    const fetchLeague = async (leagueId) => {
      const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueId}/scoreboard`;
      const response = await fetch(url);
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

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
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

// pages/api/team.js

const LEAGUES = [
  'eng.1', 'esp.1', 'ita.1', 'ger.1', 'fra.1',
  // ... (same list as espn.js)
];

module.exports = async (req, res) => {
  try {
    const { league, name, id, type } = req.query;

    if (!league || !LEAGUES.includes(league)) {
      return res.status(400).json({ success: false, error: "Invalid or missing league param" });
    }

    if (!id && !name) {
      return res.status(400).json({ success: false, error: "You must provide either 'id' or 'name'" });
    }

    let url;
    if (type === "roster") {
      if (!id) return res.status(400).json({ success: false, error: "Roster requires team 'id'" });
      url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/teams/${id}/roster`;
    } else if (type === "stats") {
      if (!id) return res.status(400).json({ success: false, error: "Stats requires team 'id'" });
      url = `https://sports.core.api.espn.com/v2/sports/soccer/leagues/${league}/seasons/2024/teams/${id}/statistics`;
    } else {
      url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard`;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ESPN data`);
    const json = await response.json();

    let data = json;

    if (!type || type === "matches") {
      let events = json.events || [];

      if (name) {
        events = events.filter(event =>
          event.competitions[0].competitors.some(
            c => c.team.displayName.toLowerCase() === name.toLowerCase()
          )
        );
      }

      if (id) {
        events = events.filter(event =>
          event.competitions[0].competitors.some(
            c => c.team.id === String(id)
          )
        );
      }

      data = {
        success: true,
        team: name || id || "unknown",
        league,
        type: "matches",
        totalMatches: events.length,
        events,
      };
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }

    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
