import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1c1917 0%, #292524 100%)',
          borderRadius: '24px',
          boxShadow: 'inset 0 0 0 3px rgba(251,146,60,0.3)',
        }}
      >
        <span
          style={{
            fontSize: 180,
            fontWeight: 800,
            color: 'rgba(251,146,60,0.9)',
            textShadow: '0 0 40px rgba(251,146,60,0.5)',
            fontFamily: 'serif',
          }}
        >
          LQ
        </span>
      </div>
    ),
    { ...size }
  )
}
