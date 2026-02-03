/**
 * LYT Communications - Backfeed Detector
 * Version: 1.0.0
 * Created: 2026-02-02
 * 
 * Analyzes segment topology to detect:
 * - Backfeed routes (where cable must be pulled backwards)
 * - Optimal pull directions
 * - Cable continuity paths
 * - Critical path segments
 * - Suggested drill setup locations
 * 
 * A "backfeed" occurs when cable must be pulled from a point further
 * down the route back towards the hub/source, typically because the
 * conduit path doesn't follow a simple linear route.
 */

/**
 * Build an adjacency graph from segments
 * @param {object[]} segments - Array of segment objects
 * @returns {object} Adjacency map { handholeId: [{ to, segment, footage }] }
 */
export function buildGraph(segments) {
  const graph = {};

  for (const seg of segments) {
    const from = seg.from_handhole;
    const to = seg.to_handhole;

    if (!graph[from]) graph[from] = [];
    if (!graph[to]) graph[to] = [];

    graph[from].push({ to, segment: seg, footage: seg.footage });
    graph[to].push({ to: from, segment: seg, footage: seg.footage });
  }

  return graph;
}

/**
 * Find the hub (source) handhole for a section
 * Hub handholes are single-letter IDs (A, B, C) that connect sections
 * @param {object[]} segments - Segments in a section
 * @returns {string|null} Hub handhole ID
 */
export function findHubHandhole(segments) {
  const candidates = new Set();

  for (const seg of segments) {
    if (/^[A-Z]$/.test(seg.from_handhole)) candidates.add(seg.from_handhole);
    if (/^[A-Z]$/.test(seg.to_handhole)) candidates.add(seg.to_handhole);
  }

  // If multiple hubs, pick the one that appears as "from" most often
  if (candidates.size === 1) return [...candidates][0];

  let best = null;
  let bestCount = 0;
  for (const hub of candidates) {
    const count = segments.filter(s => s.from_handhole === hub).length;
    if (count > bestCount) {
      bestCount = count;
      best = hub;
    }
  }
  return best;
}

/**
 * Detect backfeed routes in a section
 * A backfeed occurs when the natural pull direction (from hub outward)
 * would require pulling cable backwards through a previously-pulled segment.
 * 
 * @param {object[]} segments - Segments in a section
 * @param {string} hubId - Hub handhole ID (source point)
 * @returns {object[]} Array of { segment, direction, reason }
 */
export function detectBackfeeds(segments, hubId) {
  if (!hubId || segments.length === 0) return [];

  const graph = buildGraph(segments);
  const results = [];
  const visited = new Set();
  const pullOrder = [];

  // BFS from hub to establish natural pull order
  const queue = [hubId];
  visited.add(hubId);

  while (queue.length > 0) {
    const current = queue.shift();
    const neighbors = graph[current] || [];

    for (const { to, segment } of neighbors) {
      if (visited.has(to)) continue;
      visited.add(to);
      queue.push(to);

      // Determine if this is forward or backfeed
      const isForward = segment.from_handhole === current;

      pullOrder.push({
        segment,
        from: current,
        to,
        direction: isForward ? 'Forward' : 'Backward',
        isBackfeed: !isForward,
      });
    }
  }

  // Mark backfeed segments
  for (const entry of pullOrder) {
    results.push({
      segment_id: entry.segment.segment_id,
      contractor_id: entry.segment.contractor_id,
      from: entry.from,
      to: entry.to,
      footage: entry.segment.footage,
      direction: entry.direction,
      isBackfeed: entry.isBackfeed,
      reason: entry.isBackfeed
        ? `Cable must be pulled from ${entry.to} back to ${entry.from} (reverse of bore direction)`
        : `Standard forward pull from ${entry.from} to ${entry.to}`,
    });
  }

  return results;
}

/**
 * Calculate optimal work sequence for a section
 * Considers drill setup locations, pull directions, and dependencies
 * 
 * @param {object[]} segments - Segments in section
 * @param {string} hubId - Hub handhole ID
 * @returns {object} { sequence: [], drillSetups: [], totalFootage: number }
 */
export function calculateOptimalSequence(segments, hubId) {
  const backfeeds = detectBackfeeds(segments, hubId);
  const sequence = [];
  const drillSetups = [];
  let totalFootage = 0;
  let currentDrillLocation = hubId;

  // Sort by distance from hub (BFS order = natural sequence)
  for (const bf of backfeeds) {
    // Check if drill needs to move
    if (bf.from !== currentDrillLocation) {
      drillSetups.push({
        location: bf.from,
        reason: `Move drill to ${bf.from} for segment ${bf.contractor_id}`,
      });
      currentDrillLocation = bf.from;
    }

    sequence.push({
      order: sequence.length + 1,
      segment_id: bf.segment_id,
      contractor_id: bf.contractor_id,
      boring_from: bf.from,
      boring_to: bf.to,
      footage: bf.footage,
      pull_direction: bf.direction,
      is_backfeed: bf.isBackfeed,
      drill_setup: bf.from,
    });

    totalFootage += bf.footage;
    currentDrillLocation = bf.to;
  }

  return {
    sequence,
    drillSetups,
    totalFootage,
    hubId,
    segmentCount: sequence.length,
    backfeedCount: sequence.filter(s => s.is_backfeed).length,
  };
}

/**
 * Find critical path segments (longest chain of dependencies)
 * @param {object[]} segments - All project segments
 * @returns {object[]} Critical path segments in order
 */
export function findCriticalPath(segments) {
  // Group by section
  const sections = {};
  for (const seg of segments) {
    const section = seg.section || seg.from_handhole.replace(/\d+/g, '');
    if (!sections[section]) sections[section] = [];
    sections[section].push(seg);
  }

  // Find the longest section (most segments = most critical)
  let criticalSection = null;
  let maxSegments = 0;
  let maxFootage = 0;

  for (const [sectionId, sectionSegments] of Object.entries(sections)) {
    const totalFootage = sectionSegments.reduce((sum, s) => sum + (s.footage || 0), 0);
    if (sectionSegments.length > maxSegments || 
        (sectionSegments.length === maxSegments && totalFootage > maxFootage)) {
      criticalSection = sectionId;
      maxSegments = sectionSegments.length;
      maxFootage = totalFootage;
    }
  }

  if (!criticalSection) return [];

  return sections[criticalSection].map(seg => ({
    segment_id: seg.segment_id,
    contractor_id: seg.contractor_id,
    footage: seg.footage,
    section: criticalSection,
    isCritical: true,
  }));
}

/**
 * Suggest optimal drill setup locations to minimize moves
 * @param {object[]} segments - All segments in a section
 * @param {string} hubId - Hub handhole ID
 * @returns {object[]} Suggested drill positions with coverage
 */
export function suggestDrillSetups(segments, hubId) {
  const graph = buildGraph(segments);
  const setups = [];

  // Each unique "from" handhole needs a drill setup
  const drillPoints = new Set();
  const visited = new Set();
  const queue = [hubId];
  visited.add(hubId);
  drillPoints.add(hubId);

  while (queue.length > 0) {
    const current = queue.shift();
    const neighbors = graph[current] || [];

    for (const { to } of neighbors) {
      if (visited.has(to)) continue;
      visited.add(to);
      queue.push(to);

      // Check if this point branches (multiple connections)
      const connections = (graph[to] || []).filter(n => !visited.has(n.to) || n.to === current);
      if (connections.length > 1) {
        drillPoints.add(to);
      }
    }
  }

  for (const point of drillPoints) {
    const reachable = (graph[point] || []).map(n => ({
      to: n.to,
      footage: n.footage,
    }));

    setups.push({
      location: point,
      isHub: /^[A-Z]$/.test(point),
      reachableSegments: reachable.length,
      totalReachableFootage: reachable.reduce((sum, r) => sum + r.footage, 0),
      connections: reachable,
    });
  }

  return setups.sort((a, b) => b.totalReachableFootage - a.totalReachableFootage);
}

// v1.0.0
