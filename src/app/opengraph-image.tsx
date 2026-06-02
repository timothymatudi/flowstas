import { ImageResponse } from 'next/og'

export const alt = 'Flowstas — Streamline Your Business Operations'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Branded preview card shown when a flowstas.com link is shared.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 40, fontWeight: 700, opacity: 0.9, marginBottom: 24 }}>
          Flowstas
        </div>
        <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.1, maxWidth: 900 }}>
          The Future of Business Operations
        </div>
        <div style={{ fontSize: 34, opacity: 0.85, marginTop: 28, maxWidth: 900 }}>
          Automate tasks, manage workflows, and scale your business.
        </div>
      </div>
    ),
    { ...size }
  )
}
