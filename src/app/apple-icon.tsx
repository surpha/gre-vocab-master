import { ImageResponse } from 'next/og';
import { LOGO_DOT, LOGO_PATH } from '@/components/Logo';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// iOS applies its own rounded mask, so the background is a full square.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#18181b' }}>
        <svg viewBox="0 0 64 64" width="180" height="180">
          <path d={LOGO_PATH} fill="#ffffff" />
          <circle cx={LOGO_DOT.cx} cy={LOGO_DOT.cy} r={LOGO_DOT.r} fill="#8b5cf6" />
        </svg>
      </div>
    ),
    size,
  );
}
