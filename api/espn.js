// pages/api/espn.js

const LEAGUES = [
  'eng.1', 'esp.1', 'ita.1', 'ger.1', 'fra.1',
  'eng.3', 'ned.1', 'por.1', 'eng.2', 'bra.1',
  'arg.copa_lpf', 'uefa.europa_qual', 'uefa.champions_qual', 'fifa.worldq.conmebol', 'fifa.worldq.afc',
  'ind.1', 'uefa.nations', 'uefa.champions', 'uefa.europa', 'uefa.conference_qual',
  'fifa.world', 'conmebol.libertadores', 'nga.1', 'caf.nations',
  'uefa.europa.conf', 'afc.cup', 'fifa.Worldq.caf', 'afc.champions', 'club.friendly',
  'idn.1', 'ksa.1', 'rsa.1', 'zim.1', 'eng.charity', 'uefa.super_cup',
  'concacaf.leagues.cup', 'usa.1', 'mex.1',
];

module.exports = async (req, res) => {
  try {
    const { league, name, id, type } = req.query;

    // === Case 1: Team Roster ===
    if (type === "roster") {
      if (!league || !id) {
        return res.status(400).json({ success: false, error: "Roster requires 'league' and 'id'" });
      }
      const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/teams/${id}/roster`;
      const response = await fetch(url);
      const data = await response.json();
      return res.status(200).json({ success: true, league, team: id, type: "roster", data });
    }

    // === Case 2: Team Stats ===
    if (type === "stats") {
      if (!league || !id) {
        return res.status(400).json({ success: false, error: "Stats requires 'league' and 'id'" });
      }
      const url = `https://sports.core.api.espn.com/v2/sports/soccer/leagues/${league}/seasons/2024/teams/${id}/statistics`;
      const response = await fetch(url);
      const data = await response.json();
      return res.status(200).json({ success: true, league, team: id, type: "stats", data });
    }

    // === Case 3: Matches (All / League / Team) ===
    const leaguesToFetch = league && LEAGUES.includes(league) ? [league] : LEAGUES;

    const fetchLeague = async (leagueId) => {
      const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueId}/scoreboard`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ${leagueId}`);
      return response.json();
    };

    const results = await Promise.allSettled(leaguesToFetch.map(fetchLeague));

    let allEvents = results.reduce((acc, result) => {
      if (result.status === "fulfilled" && result.value?.events) {
        acc.push(...result.value.events);
      }
      return acc;
    }, []);

    // Filter by team if name or id provided
    if (name) {
      allEvents = allEvents.filter(event =>
        event.competitions[0].competitors.some(
          c => c.team.displayName.toLowerCase() === name.toLowerCase()
        )
      );
    }

    if (id) {
      allEvents = allEvents.filter(event =>
        event.competitions[0].competitors.some(
          c => c.team.id === String(id)
        )
      );
    }

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
      type: "matches",
      totalLeagues: leaguesToFetch.length,
      totalMatches: allEvents.length,
      league: league || "all",
      team: name || id || "all",
      events: allEvents,
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
