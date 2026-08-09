/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./public/**/*.html"
  ],
  theme: {
    extend: {
      colors: {
        // 'MΛĐ Gambit' Deep Celestial Core Palette
        space: {
          deep: '#0C0E1E',   // Deep Space Canvas
          card: '#13162C',   // Contrasting Card Surface
          panel: '#191C36',  // Panel & Secondary Section Background
          overlay: 'rgba(12, 14, 30, 0.95)' // High-fidelity overlay tint
        },
        // Premium 'MΛĐ Gambit' Branding & Accents
        brand: {
          gold: '#FFD700',       // Pure Asgaard Gold
          goldDark: '#B8860B',   // Deep Antique Gold
          purple: '#C59B27',     // Burnished Royal Gold
          pink: '#FF4B72',       // Satirical Edge Hot Pink (BrandCrimson)
          indigo: '#FFD700',     // Neon Cyan / Gold Hybrid highlight
          periwinkle: '#E2CC8E'  // Gold-white typography secondary neutral
        },
        // Neon Satirical Signaling Voltages
        neon: {
          cyan: '#00E5FF',       // Cyber Cooling Cyan
          magenta: '#FF007F',    // Energetic Plasma Flare
          green: '#10B981',      // Secure Yield Green
          crimson: '#FF0D00',    // Overload Red Alerts
          purple: '#9D4EDD'      // Decommissioned BORG shade
        }
      },
      fontFamily: {
        // High-legibility headings pairing
        display: ['"Space Grotesk"', 'sans-serif'], // Satirical headings and conviction titles
        sans: ['Inter', 'sans-serif'],              // Clean body copy & general UI
        mono: ['"JetBrains Mono"', 'monospace'],    // Telemetry labels & data tickers
        narrow: ['"Outfit"', 'sans-serif']          // Sleek compressed labeling
      },
      borderWidth: {
        '1.15': '1.15px', // Exact high-fidelity premium hair-line borders
      },
      boxShadow: {
        'gold-glow': '0 0 15px rgba(255, 215, 0, 0.25)',
        'cyan-glow': '0 0 15px rgba(0, 229, 255, 0.25)',
        'crimson-overload': '0 0 20px rgba(255, 13, 0, 0.35)'
      },
      backgroundImage: {
        // Glass-morphism reflections and gold metal sheeting brushes
        'gold-flake': 'linear-gradient(135deg, #B8860B 0%, #FFDF00 25%, #FFF8DC 50%, #FFD700 75%, #DAA520 100%)',
        'asgaard-gold': 'linear-gradient(90deg, #C59B27 0%, #FFFFEA7C 30%, #FFFFFF 50%, #FFFFEA7C 70%, #C59B27 100%)',
        'liquid-sheen': 'vertical-gradient(to bottom, rgba(255, 234, 124, 0.8) 0%, rgba(197, 155, 39, 0.3) 30%, rgba(139, 101, 8, 0.6) 70%, rgba(255, 234, 124, 0.9) 100%)'
      }
    },
  },
  plugins: [
    // Tailored Utility Classes for 'MΛĐ Gambit' web2/web3 blend
    function ({ addUtilities, theme }) {
      addUtilities({
        // Standard high-fidelity glass-morphism container
        '.glass-container': {
          'background-color': 'rgba(4, 7, 24, 0.72)',
          'backdrop-filter': 'blur(16px)',
          'border': `1.15px solid ${theme('colors.brand.gold')}`,
          'position': 'relative',
          'box-shadow': '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
        },
        // Inner nested interactive glass panel
        '.inner-glass-container': {
          'background-color': 'rgba(4, 7, 24, 0.55)',
          'backdrop-filter': 'blur(12px)',
          'border': '1.15px solid rgba(255, 215, 0, 0.5)',
          'box-shadow': '0 4px 16px 0 rgba(0, 0, 0, 0.25)'
        },
        // Multi-directional gold dynamic mirror sheen reflection effects
        '.glass-mirror-sheen': {
          'background': 'linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0) 100%)',
          'opacity': '0.25',
          'pointer-events': 'none'
        }
      })
    }
  ]
}
