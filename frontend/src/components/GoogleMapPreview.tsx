import React from 'react';
import { MapPin, ExternalLink } from 'lucide-react';

interface GoogleMapPreviewProps {
  lat?: number | null;
  lng?: number | null;
  locationString?: string | null;
  height?: string;
  showExternalLink?: boolean;
}

/**
 * Helper to extract latitude and longitude from location string format like "-6.2088, 106.8456"
 */
export const parseCoordinates = (locStr?: string | null): { lat: number; lng: number } | null => {
  if (!locStr) return null;
  const match = locStr.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }
  return null;
};

export const GoogleMapPreview: React.FC<GoogleMapPreviewProps> = ({
  lat: propLat,
  lng: propLng,
  locationString,
  height = '180px',
  showExternalLink = true,
}) => {
  // Derive coordinates from props or parsed locationString
  let lat = propLat;
  let lng = propLng;

  if ((lat === undefined || lat === null || lng === undefined || lng === null) && locationString) {
    const parsed = parseCoordinates(locationString);
    if (parsed) {
      lat = parsed.lat;
      lng = parsed.lng;
    }
  }

  const hasCoords = typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);

  if (!hasCoords) {
    return (
      <div
        style={{
          height,
          border: '1px dashed var(--border)',
          borderRadius: 'var(--radius-sm)',
          background: '#fafafa',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--muted-foreground)',
          fontSize: '0.75rem',
          gap: '0.375rem',
          padding: '1rem',
          textAlign: 'center',
        }}
      >
        <MapPin size={20} color="#a1a1aa" />
        <span>Koordinat GPS belum tersedia untuk preview maps</span>
      </div>
    );
  }

  const mapEmbedUrl = `https://maps.google.com/maps?q=${lat},${lng}&hl=id&z=16&output=embed`;
  const mapExternalUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
        background: '#ffffff',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.35rem 0.625rem',
          background: '#f4f4f5',
          borderBottom: '1px solid var(--border)',
          fontSize: '0.6875rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#27272a', fontWeight: 500 }}>
          <MapPin size={12} color="#ef4444" />
          <span>Posisi GPS: <strong>{lat!.toFixed(6)}, {lng!.toFixed(6)}</strong></span>
        </div>

        {showExternalLink && (
          <a
            href={mapExternalUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              color: '#2563eb',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            <span>Buka Google Maps</span>
            <ExternalLink size={10} />
          </a>
        )}
      </div>

      <iframe
        title={`Google Maps Preview ${lat},${lng}`}
        width="100%"
        height={height}
        style={{ border: 0, display: 'block' }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src={mapEmbedUrl}
      />
    </div>
  );
};
