/**
 * Google Geocoding API Integration
 * Documentation: https://developers.google.com/maps/documentation/geocoding/overview
 */

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

interface GeocodingApiResponse {
  status: string;
  results: Array<{
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }>;
}

let apiKey: string | null = null;

/**
 * Set the API key (shared with Places API)
 */
export function setGeocodingApiKey(key: string): void {
  apiKey = key;
}

/**
 * Validate US zip code format (5 digits or ZIP+4)
 */
export function isValidZipCode(zipCode: string): boolean {
  // Remove spaces and hyphens
  const cleaned = zipCode.replace(/[\s-]/g, '');

  // Check for 5 digits or 9 digits (ZIP+4)
  return /^\d{5}$/.test(cleaned) || /^\d{9}$/.test(cleaned);
}

/**
 * Convert zip code to coordinates using Google Geocoding API
 */
export async function geocodeZipCode(zipCode: string): Promise<GeocodeResult> {
  if (!apiKey) {
    throw new Error('Geocoding API not initialized. API key is required.');
  }

  // Validate zip code format
  if (!isValidZipCode(zipCode)) {
    throw new Error('Invalid zip code format. Please enter a valid 5-digit US zip code.');
  }

  // Clean the zip code
  const cleanedZipCode = zipCode.replace(/[\s-]/g, '');

  // Add country restriction to ensure US results
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${cleanedZipCode}&components=country:US&key=${apiKey}`;

  try {
    console.log('Geocoding zip code:', cleanedZipCode);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json() as GeocodingApiResponse;

    // Check for API errors
    if (data.status !== 'OK') {
      if (data.status === 'ZERO_RESULTS') {
        throw new Error('Zip code not found. Please check and try again.');
      }
      throw new Error(`Geocoding failed: ${data.status}`);
    }

    // Extract coordinates from first result
    const result = data.results[0];
    const location = result.geometry.location;

    console.log('Geocoded successfully:', {
      zipCode: cleanedZipCode,
      lat: location.lat,
      lng: location.lng,
      address: result.formatted_address
    });

    return {
      latitude: location.lat,
      longitude: location.lng,
      formattedAddress: result.formatted_address,
    };
  } catch (error: any) {
    console.error('Geocoding error:', error);

    // Re-throw with user-friendly message
    if (error.message.includes('Invalid zip code') || error.message.includes('not found')) {
      throw error;
    }

    throw new Error('Unable to geocode zip code. Please check your internet connection and try again.');
  }
}
