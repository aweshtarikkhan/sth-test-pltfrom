export interface GeoLocationResult {
  lat: number | null;
  lng: number | null;
  address: string;
  accuracy?: number | null;
  source: 'gps' | 'wifi' | 'fallback';
}

/**
 * Check browser location permission state.
 */
export async function checkLocationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
    try {
      const res = await navigator.permissions.query({ name: 'geolocation' });
      return res.state;
    } catch {
      return 'prompt';
    }
  }
  return 'prompt';
}

/**
 * Capture precise pin-point location for attendance.
 *
 * CRITICAL RULES:
 * 1. NEVER use third-party IP geolocation APIs (e.g. ipapi, ipwho) — they are wildly inaccurate
 *    and can report foreign countries (e.g. Russia, US) for Indian broadband/VPN/mobile users.
 * 2. Only use the device's native Geolocation API (GPS hardware on mobile, WiFi triangulation on laptop).
 * 3. Give sufficient time (15 seconds) so the user has time to click "Allow" on the browser permission prompt.
 * 4. First try High Accuracy (GPS sensor). If unavailable (common on laptops without GPS chips),
 *    smoothly fall back to Low Accuracy (WiFi network triangulation).
 * 5. Reverse geocode via BigDataCloud / OpenStreetMap to obtain human-readable Indian street/locality address.
 * 6. If location is completely blocked or unavailable on the device, return a clean non-misleading status:
 *    "Workplace Device / Web Check-In (Location Unavailable)" with null coordinates.
 */
export async function captureAccurateLocation(): Promise<GeoLocationResult> {
  let coords: { lat: number; lng: number; accuracy: number } | null = null;
  let detectedSource: 'gps' | 'wifi' | 'fallback' = 'fallback';

  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    // Attempt 1: High Accuracy (GPS hardware on phones, precise WiFi on laptops)
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0, // Fresh fix only, no stale cache
        });
      });

      coords = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy || 9999,
      };
      detectedSource = pos.coords.accuracy && pos.coords.accuracy <= 50 ? 'gps' : 'wifi';
    } catch (err: any) {
      console.warn('High accuracy geolocation failed, attempting standard WiFi triangulation:', err?.message);

      // Attempt 2: Standard Accuracy (WiFi triangulation — standard for laptops & desktops)
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 8000,
            maximumAge: 30000,
          });
        });

        coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy || 9999,
        };
        detectedSource = 'wifi';
      } catch (err2: any) {
        console.warn('Standard geolocation also unavailable:', err2?.message);
        coords = null;
      }
    }
  }

  // If real device coordinates were obtained:
  if (coords && typeof coords.lat === 'number' && typeof coords.lng === 'number') {
    const lat = coords.lat;
    const lng = coords.lng;
    const accuracy = Math.round(coords.accuracy);

    let address = '';

    // 1. Primary reverse geocode: BigDataCloud (CORS-friendly, highly accurate for India)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const parts = [
          data.locality || data.localityInfo?.administrative?.[3]?.name,
          data.city || data.localityInfo?.administrative?.[2]?.name,
          data.principalSubdivision || data.localityInfo?.administrative?.[1]?.name,
          data.postcode,
          data.countryName,
        ].filter(Boolean);

        if (parts.length > 0) {
          address = Array.from(new Set(parts)).join(', ');
        }
      }
    } catch (e) {
      console.warn('BigDataCloud reverse geocode error:', e);
    }

    // 2. Secondary fallback reverse geocode: OpenStreetMap Nominatim
    if (!address) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
          {
            signal: controller.signal,
            headers: { 'Accept-Language': 'en' },
          }
        );
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data?.display_name) {
            address = data.display_name;
          }
        }
      } catch (e) {
        console.warn('Nominatim reverse geocode error:', e);
      }
    }

    if (!address) {
      address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }

    // Format human-friendly accuracy badge
    const accuracyTag = accuracy <= 15 ? 'Pinpoint'
                      : accuracy <= 50 ? 'Precise'
                      : accuracy <= 200 ? 'Approximate'
                      : 'Broad';
    const formattedAddress = `${address} [${accuracyTag} ~${accuracy}m]`;

    return {
      lat,
      lng,
      address: formattedAddress,
      accuracy,
      source: detectedSource,
    };
  }

  // Clean fallback when device location is not available or denied — NEVER fake foreign countries!
  return {
    lat: null,
    lng: null,
    address: 'Workplace Device / Web Check-In (Location Sensor Unavailable)',
    accuracy: null,
    source: 'fallback',
  };
}
