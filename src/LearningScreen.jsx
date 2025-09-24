export default function LearningScreen({ question, onBack }) {
  return (
    <div
      style={{
        height: '100vh',
        boxSizing: 'border-box',
        width: '100vw',
        background: `url(${question?.slideUrl}) center bottom / cover no-repeat`,
        fit: 'cover',
      }}
    >
      {/* Back Button - Top Left */}
      <button
        onClick={onBack}
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 3,
          background: 'rgba(255, 255, 255, 0.25)',
          border: '1px solid #ccc',
          borderRadius: 25,
          padding: '10px 15px',
          color: '#983a34',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.4)'
          e.target.style.transform = 'scale(1.05)'
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.25)'
          e.target.style.transform = 'scale(1)'
        }}
      >
        ← Home
      </button>
    </div>
  )
}
