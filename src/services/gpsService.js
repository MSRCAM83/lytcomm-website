/**
 * LYT Communications - GPS Tracking Service
 * Version: 1.0.0
 * Created: 2026-02-02
 * 
 * Manages crew GPS location tracking:
 * - Browser Geolocation API integration
 * - Periodic location updates (configurable interval)
 * - Activity detection (stationary vs moving)
 * - Battery-conscious tracking modes
 * - Location history for segment verification
 */

// Default update interval (30 seconds)
const DEFAULT_INTERVAL = 30000;

// Minimum distance (meters) to register as movement
const MIN_MOVEMENT_THRESHOLD = 5;

let watchId = null;
let updateTimer = null;
let lastPosition = null;
let locationCallback = null;
let errorCallback = null;
let trackingActive = false;

/**
 * Start GPS tracking
 * @param {object} options
 * @param {function} options.onUpdate - Called with { lat, lng, accuracy, speed, timestamp, isMoving }
 * @param {function} options.onError - Called with error message
 * @param {number} options.interval - Update interval in ms (default 30000)
 * @param {boolean} options.highAccuracy - Use high accuracy GPS (default false to save battery)
 * @returns {boolean} Whether tracking started successfully
 */
export function startTracking(options = {}) {
  if (!('geolocation' in navigator)) {
    if (options.onError) options.onError('Geolocation not supported');
    return false;
  }

  locationCallback = options.onUpdate || null;
  errorCallback = options.onError || null;
  const interval = options.interval || DEFAULT_INTERVAL;
  const highAccuracy = options.highAccuracy || false;

  const geoOptions = {
    enableHighAccuracy: highAccuracy,
    timeout: 10000,
    maximumAge: highAccuracy ? 0 : 30000,
  };

  // Get initial position
  navigator.geolocation.getCurrentPosition(
    (pos) => handlePosition(pos),
    (err) => handleError(err),
    geoOptions
  );

  // Set up periodic updates
  updateTimer = setInterval(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => handlePosition(pos),
      (err) => handleError(err),
      geoOptions
    );
  }, interval);

  trackingActive = true;
  return true;
}

/**
 * Stop GPS tracking
 */
export function stopTracking() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  if (updateTimer) {
    clearInterval(updateTimer);
    updateTimer = null;
  }
  trackingActive = false;
  lastPosition = null;
}

/**
 * Get current position (one-shot)
 * @returns {Promise<{lat: number, lng: number, accuracy: number}>}
 */
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
          timestamp: new Date(pos.timestamp).toISOString(),
        });
      },
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  });
}

/**
 * Check if tracking is currently active
 * @returns {boolean}
 */
export function isTracking() {
  return trackingActive;
}

/**
 * Get the last known position
 * @returns {object|null}
 */
export function getLastPosition() {
  return lastPosition;
}

/**
 * Calculate distance between two GPS points (Haversine formula)
 * @param {number} lat1 - Point 1 latitude
 * @param {number} lng1 - Point 1 longitude
 * @param {number} lat2 - Point 2 latitude
 * @param {number} lng2 - Point 2 longitude
 * @returns {number} Distance in meters
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if a GPS point is near a segment (within threshold)
 * @param {object} point - { lat, lng }
 * @param {object} segStart - { lat, lng }
 * @param {object} segEnd - { lat, lng }
 * @param {number} thresholdMeters - Distance threshold (default 50m)
 * @returns {boolean}
 */
export function isNearSegment(point, segStart, segEnd, thresholdMeters = 50) {
  const distToStart = calculateDistance(point.lat, point.lng, segStart.lat, segStart.lng);
  const distToEnd = calculateDistance(point.lat, point.lng, segEnd.lat, segEnd.lng);
  const segLength = calculateDistance(segStart.lat, segStart.lng, segEnd.lat, segEnd.lng);

  // Point is near if within threshold of either endpoint or
  // the sum of distances to endpoints is close to segment length (point is between)
  if (distToStart <= thresholdMeters || distToEnd <= thresholdMeters) return true;
  if (distToStart + distToEnd <= segLength + thresholdMeters) return true;
  return false;
}

/**
 * Find which segment a crew is closest to
 * @param {object} position - { lat, lng }
 * @param {object[]} segments - Array of segments with gps_start_lat/lng and gps_end_lat/lng
 * @returns {object|null} Closest segment with distance
 */
export function findNearestSegment(position, segments) {
  if (!position || !segments?.length) return null;

  let nearest = null;
  let minDist = Infinity;

  for (const seg of segments) {
    if (!seg.gps_start_lat || !seg.gps_start_lng) continue;

    const distStart = calculateDistance(
      position.lat, position.lng,
      parseFloat(seg.gps_start_lat), parseFloat(seg.gps_start_lng)
    );

    const distEnd = seg.gps_end_lat ? calculateDistance(
      position.lat, position.lng,
      parseFloat(seg.gps_end_lat), parseFloat(seg.gps_end_lng)
    ) : distStart;

    const dist = Math.min(distStart, distEnd);

    if (dist < minDist) {
      minDist = dist;
      nearest = { ...seg, distance: Math.round(dist) };
    }
  }

  return nearest;
}

// ============================================================
// Internal helpers
// ============================================================

function handlePosition(pos) {
  const newPos = {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
    speed: pos.coords.speed,
    heading: pos.coords.heading,
    timestamp: new Date(pos.timestamp).toISOString(),
    isMoving: false,
  };

  // Detect movement
  if (lastPosition) {
    const dist = calculateDistance(
      lastPosition.lat, lastPosition.lng,
      newPos.lat, newPos.lng
    );
    newPos.isMoving = dist > MIN_MOVEMENT_THRESHOLD;
    newPos.distanceFromLast = Math.round(dist);
  }

  lastPosition = newPos;

  if (locationCallback) {
    locationCallback(newPos);
  }
}

function handleError(err) {
  const messages = {
    1: 'Location permission denied',
    2: 'Location unavailable',
    3: 'Location request timeout',
  };
  const msg = messages[err.code] || 'Unknown location error';
  if (errorCallback) errorCallback(msg);
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

// v1.0.0
