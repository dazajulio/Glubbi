/**
 * Utility functions for verifying client geolocation against restaurant delivery zones (GeoJSON Polygons).
 */

export interface GeoJSONGeometry {
  type: 'Polygon' | 'MultiPolygon' | string;
  coordinates: any;
}

export interface DeliveryZone {
  id: string;
  name: string;
  price: number;
  geom: GeoJSONGeometry | string;
  is_active?: boolean;
}

/**
 * Checks if a point [lng, lat] is inside a single Polygon ring set (GeoJSON Polygon coordinates: number[][][])
 */
export function isPointInPolygonRingSet(point: [number, number], polygonCoords: number[][][]): boolean {
  const [x, y] = point; // x = lng, y = lat
  let inside = false;

  // polygonCoords[0] is the outer ring boundary
  const outerRing = polygonCoords[0];
  if (!outerRing || outerRing.length < 3) return false;

  for (let j = 0, k = outerRing.length - 1; j < outerRing.length; k = j++) {
    const xi = outerRing[j][0], yi = outerRing[j][1];
    const xk = outerRing[k][0], yk = outerRing[k][1];

    const intersect = ((yi > y) !== (yk > y)) &&
      (x < ((xk - xi) * (y - yi)) / (yk - yi) + xi);
    if (intersect) inside = !inside;
  }

  // If outside outer ring, return false immediately
  if (!inside) return false;

  // Check inner holes (polygonCoords[1..n]) - if inside any hole, point is outside
  for (let ringIdx = 1; ringIdx < polygonCoords.length; ringIdx++) {
    const holeRing = polygonCoords[ringIdx];
    let inHole = false;
    for (let j = 0, k = holeRing.length - 1; j < holeRing.length; k = j++) {
      const xi = holeRing[j][0], yi = holeRing[j][1];
      const xk = outerRing[k][0], yk = outerRing[k][1];

      const intersect = ((yi > y) !== (yk > y)) &&
        (x < ((xk - xi) * (y - yi)) / (yk - yi) + xi);
      if (intersect) inHole = !inHole;
    }
    if (inHole) return false;
  }

  return true;
}

/**
 * Checks if a point [lng, lat] falls inside a GeoJSON geometry (Polygon or MultiPolygon)
 */
export function isPointInGeometry(point: [number, number], geomRaw: GeoJSONGeometry | string | null | undefined): boolean {
  if (!geomRaw) return false;

  let geom: GeoJSONGeometry;
  if (typeof geomRaw === 'string') {
    try {
      geom = JSON.parse(geomRaw);
    } catch {
      return false;
    }
  } else {
    geom = geomRaw;
  }

  if (!geom || !geom.coordinates) return false;

  if (geom.type === 'Polygon') {
    return isPointInPolygonRingSet(point, geom.coordinates as number[][][]);
  } else if (geom.type === 'MultiPolygon') {
    const multiCoords = geom.coordinates as number[][][][];
    for (const polyCoords of multiCoords) {
      if (isPointInPolygonRingSet(point, polyCoords)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Finds the matching delivery zone for a client's GPS coordinates (latitude, longitude).
 * Returns the matching zone object with delivery price, or null if outside all defined zones.
 */
export function findMatchingDeliveryZone(
  lat: number,
  lng: number,
  zones: DeliveryZone[]
): { zone: DeliveryZone; price: number } | null {
  if (!zones || zones.length === 0) return null;

  const point: [number, number] = [lng, lat];

  for (const zone of zones) {
    if (zone.is_active === false) continue;
    if (isPointInGeometry(point, zone.geom)) {
      return {
        zone,
        price: Number(zone.price) || 0
      };
    }
  }

  return null;
}
