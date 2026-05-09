/**
 * Haversine distance in km between two lat/lng points.
 */
export function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg) {
  return (deg * Math.PI) / 180
}

/**
 * Score 0–5000 based on distance (exponential decay, like GeoGuessr).
 * 0 km = 5000, 2000 km ≈ 1839, 10000 km ≈ 135
 */
export function scoreFromDistanceKm(km) {
  if (km <= 0) return 5000
  return Math.round(5000 * Math.exp(-km / 2000))
}
