# 🚀 MADHATs Gambit — CLAUDE CODE BUILD PACKAGE
**Project**: MADHATs Gambit Landing Page  
**Version**: 5.0 Production Build  
**Target**: Pixel-perfect implementation from PNG mockup  
**Timeline**: 3-5 days  
**Status**: ✅ Ready to build

---

## 📋 HANDOFF CONTENTS

This package contains everything needed to build the MADHATs Gambit platform:

### **1. Reference Materials:**
- `LandingPage_and_Dashbord_Layout_MADHATs.png` - Primary design reference
- `PNG_TO_IMPLEMENTATION_MAPPING.md` - Complete design analysis
- `MADHATS_WIREFRAME_SPECIFICATION.md` - Section-by-section breakdown
- `madhats-exact-design-v5.jsx` - Reference implementation

### **2. Build Specifications:**
- Complete component breakdown
- Color palette definitions
- Spacing/margin specifications
- Responsive breakpoints
- Animation specifications

### **3. Build Sequence:**
- 3-phase implementation plan
- Day-by-day task breakdown
- Priority ordering
- Testing checkpoints

---

## 🎯 PROJECT OVERVIEW

### **What We're Building:**

A prediction market platform landing page with:
- Dual ticker bars (crypto prices + platform metrics)
- Retro flip clock centerpiece (14:32:45 style)
- Dopamine carousel (4 gold-framed widget cards)
- Featured market cards (3 purple neon prediction cards)
- Compact dual sidebars (left nav + right actions)
- Bottom navigation bar
- Complete responsive design

### **Design Philosophy:**

**Visual Style:**
- Retro-futuristic aesthetic (80s flip clock meets cyberpunk neon)
- High contrast (black backgrounds, bright accents)
- Minimal margins (tight, efficient spacing)
- Glowing effects (neon borders, shadows)

**Color Palette:**
- Primary: Gold (#FFD700) - accent, borders, clock
- Secondary: Cyan (#00FFFF) - buttons, metrics bar
- Tertiary: Purple (#9D4EDD) - market cards
- Background: Black (#000, #0a0a0a, #1a1a1a)
- Success: Neon Green (#39FF14) - positive changes

**Typography:**
- Headers: Bold 900, letter-spacing 0.05-0.15em
- Body: System UI, 0.85-1.1rem
- Clock: Monospace (Courier New), 3.5rem

---

## 🏗️ BUILD SEQUENCE

### **PHASE 1: STRUCTURE (Day 1) - 6-8 hours**

**Objective:** Build the layout skeleton and navigation systems

#### **Task 1.1: Dual Ticker System** ⏱️ 45 min
```
Create two ticker bars at the top:

TICKER 1 (Crypto Prices):
- Background: Black gradient
- Border: 2px gold bottom
- Content: BTC $69,420 +4.2% | ETH $3,500 +2.5% | SOL $180 +5% | XRP $2.1
- Animation: Infinite scroll left
- Colors: Gold symbols, white prices, green changes
- Height: 36px

TICKER 2 (Platform Metrics):
- Background: Cyan→Pink gradient
- Border: 3px cyan bottom
- Content: MADx $0.85 +12% | DEGEN +8.5% | CHAOS 67% | VOLUME $2.4M
- Font: Bold 900, black text
- Height: 40px

Files to create:
- components/CryptoTicker.jsx
- components/MetricsBar.jsx
- styles/tickers.css

Code reference: madhats-exact-design-v5.jsx lines 50-120
```

#### **Task 1.2: Header Bar** ⏱️ 1 hour
```
Build header with:
- Hamburger menu (mobile)
- MADHATs logo badge (60px circle, gold gradient, 🎰 emoji)
- Search bar (400px max-width, dark bg, icon)
- Platform icons (4 icons: Discord, Twitter, Telegram, Unreal)
- Login button (dark bg, gold border)
- Sign Up button (gold gradient, black text)

Layout: Flexbox, gap 16px
Height: 76px
Background: #0a0a0a
Border: 1px solid #333

Files to create:
- components/Header.jsx
- components/SearchBar.jsx
- components/LogoBadge.jsx
- styles/header.css

Code reference: madhats-exact-design-v5.jsx lines 125-180
```

#### **Task 1.3: Left Sidebar Navigation** ⏱️ 1.5 hours
```
Build compact sidebar with:
- Width: 160px fixed
- Background: #0a0a0a
- Border: 1px solid #222 (right side)
- Padding: 8px 4px (minimal!)
- Position: Fixed left

15 Navigation items:
1. Home (with 🏠 icon)
2. Trending
3. Local
4. International
5. Sports
6. Tech
7. Science
8. Health
9. Business
10. Entertainment
11. Culture
12. Environment
13. Opinion
14. Weather
15. About Us

Item styling:
- Padding: 10px 12px
- Margin: 2px 0 (minimal!)
- Font: 0.85rem
- Default: Gray text (#999)
- Hover: Cyan text (#00FFFF), light bg
- Active: Gold text (#FFD700), gold left border (3px)

Files to create:
- components/Sidebar.jsx
- components/NavItem.jsx
- styles/sidebar.css

Code reference: madhats-exact-design-v5.jsx lines 185-240
```

#### **Task 1.4: Right Sidebar Actions** ⏱️ 1.5 hours
```
Build right action sidebar with:
- Width: 200px fixed
- Background: #0a0a0a
- Border: 1px solid #222 (left side)
- Position: Fixed right
- Display: Desktop only (hidden on mobile)

17 Action items (from PNG reference):
1. 🏠 Home
2. 🔥 Login
3. ✏️ Login
4. 📝 Sign Up
5. ⚙️ Settings
6. ❓ Help
7. 📞 Contact
8. 📋 Terms
9. 🔒 Privacy
10. 💼 Careers
11. 📢 Advertise
12. 📅 Events
13. 🎙️ Podcasts
14. 🎥 Videos
15. 📸 Photos
16. 📡 Live
17. (Grok logo at bottom)

Styling: Same as left sidebar
Item padding: 10px 12px
Minimal margins: 2px 0

Files to create:
- components/RightSidebar.jsx
- components/ActionItem.jsx
- styles/right-sidebar.css

New component (not in reference implementation)
```

#### **Task 1.5: Main Content Grid** ⏱️ 1 hour
```
Setup main content area:
- Margin: 0 200px 0 160px (between sidebars)
- Padding: 20px
- Background: Transparent (shows body black)
- Max-width: 1400px
- Min-height: calc(100vh - 140px)

Grid system:
- Stats: repeat(4, 1fr), gap 20px
- Carousel: repeat(4, 1fr), gap 20px
- Markets: repeat(3, 1fr), gap 20px

Responsive:
- Tablet: 2 columns
- Mobile: 1 column, no sidebars

Files to create:
- components/MainContent.jsx
- styles/layout.css
- styles/grid.css

Code reference: madhats-exact-design-v5.jsx lines 245-280
```

#### **Task 1.6: Bottom Navigation** ⏱️ 45 min
```
Build bottom nav bar:
- Position: Fixed bottom
- Height: 60px
- Background: #0a0a0a
- Border: 2px solid #00FFFF (top)
- Display: Flex, justify-content space-around

4 Navigation icons (all cyan):
1. Home (house icon)
2. Charts (trending up icon)
3. Wallet (dollar sign icon)
4. Profile (user icon)

Icon styling:
- Size: 24px
- Color: #00FFFF
- Hover: Scale 1.1, glow effect
- Gap: 4px between icon and label

Files to create:
- components/BottomNav.jsx
- styles/bottom-nav.css

Code reference: madhats-exact-design-v5.jsx lines 285-310
```

**Phase 1 Checkpoint:**
- [ ] All tickers scrolling smoothly
- [ ] Header fully functional
- [ ] Both sidebars visible and styled
- [ ] Main grid responsive
- [ ] Bottom nav displays correctly
- [ ] Mobile: Sidebars collapse, hamburger appears

---

### **PHASE 2: CENTERPIECE (Day 2) - 6-8 hours**

**Objective:** Build the retro flip clock - the signature element

#### **Task 2.1: Flip Clock Structure** ⏱️ 2 hours
```
Build flip clock displaying HH:MM:SS

Outer container:
- Background: linear-gradient(135deg, #B8860B, #FFD700, #DAA520)
- Padding: 20px 30px
- Border-radius: 20px
- Border: 4px solid #FFD700
- Box-shadow: 
  * Outer: 0 0 40px rgba(255, 215, 0, 0.6)
  * Inset: 0 4px 8px rgba(0,0,0,0.3)

Digit structure:
- 8 digit boxes (2 hours, 2 minutes, 2 seconds)
- 2 separator dots (between hours/minutes and minutes/seconds)

Each digit box:
- Background: #1a1a1a
- Border: 2px solid #333
- Border-radius: 8px
- Padding: 15px 10px
- Min-width: 60px
- Center alignment
- Box-shadow: inset 0 2px 6px rgba(0,0,0,0.8)

Flip line (horizontal split):
- Position: Absolute, top 50%
- Width: 100%
- Height: 2px
- Background: #222

Number styling:
- Font: 'Courier New', monospace
- Size: 3.5rem
- Weight: 900
- Color: #FFD700
- Text-shadow: 
  * Glow: 0 0 10px rgba(255, 215, 0, 0.8)
  * Depth: 0 2px 4px rgba(0,0,0,0.9)

Separator dots:
- Size: 12px circle
- Background: #FFD700
- Box-shadow: 0 0 10px rgba(255, 215, 0, 0.8)
- Vertical gap: 10px between dots

Files to create:
- components/FlipClock.jsx
- components/FlipDigit.jsx
- components/FlipSeparator.jsx
- styles/flip-clock.css

Code reference: madhats-exact-design-v5.jsx lines 315-410
```

#### **Task 2.2: Flip Animation** ⏱️ 2.5 hours
```
Implement flip card animation for digit changes

Animation sequence (when digit changes):
1. Top half flips down (0.3s)
2. Bottom half flips up (0.3s)
3. New digit revealed

CSS Keyframes:
@keyframes flipTop {
  0% { transform: rotateX(0deg); }
  100% { transform: rotateX(-90deg); }
}

@keyframes flipBottom {
  0% { transform: rotateX(90deg); }
  100% { transform: rotateX(0deg); }
}

Digit structure for animation:
<div class="flip-digit">
  <div class="flip-top">
    <span class="flip-number">{currentDigit}</span>
  </div>
  <div class="flip-bottom">
    <span class="flip-number">{currentDigit}</span>
  </div>
  <div class="flip-top flip-next">
    <span class="flip-number">{nextDigit}</span>
  </div>
  <div class="flip-bottom flip-next">
    <span class="flip-number">{nextDigit}</span>
  </div>
</div>

JavaScript logic:
- Compare current vs new digit
- Trigger flip animation only when different
- Sequence: top flip (0.3s) → bottom flip (0.3s)
- Reset to static state after animation

Files to update:
- components/FlipDigit.jsx (add animation logic)
- styles/flip-clock.css (add keyframes)
- Add flip-animations.css

Code reference: Complex animation, needs custom implementation
Inspiration: https://codepen.io/shshaw/pen/vKzoLL
```

#### **Task 2.3: Real-Time Clock Connection** ⏱️ 1 hour
```
Connect to system time and update every second

JavaScript:
const [time, setTime] = useState(new Date());

useEffect(() => {
  const timer = setInterval(() => {
    setTime(new Date());
  }, 1000);
  
  return () => clearInterval(timer);
}, []);

// Format time
const hours = String(time.getHours()).padStart(2, '0');
const minutes = String(time.getMinutes()).padStart(2, '0');
const seconds = String(time.getSeconds()).padStart(2, '0');

// Split into individual digits
const digits = [
  hours[0], hours[1],
  minutes[0], minutes[1],
  seconds[0], seconds[1]
];

Optimization:
- Only trigger flip animation when digit actually changes
- Use useMemo for digit splitting
- Prevent unnecessary re-renders

Files to update:
- components/FlipClock.jsx (add time logic)

Code reference: madhats-exact-design-v5.jsx lines 35-50
```

#### **Task 2.4: Ornate Border Styling** ⏱️ 1.5 hours
```
Add decorative elements to clock frame

Corner ornaments:
- Position: Absolute at 4 corners
- Size: 20px × 20px
- Border: 2px solid #FFD700
- Border-radius: 50% (top-left, top-right corners)
- Box-shadow: 0 0 10px rgba(255, 215, 0, 0.8)

Top/bottom accent bars:
- Position: Top and bottom of clock
- Height: 4px
- Background: linear-gradient(90deg, #FFD700, #FFA500, #FFD700)
- Width: 100%
- Animation: Shimmer effect (subtle)

Shimmer keyframes:
@keyframes shimmer {
  0% { background-position: -200px; }
  100% { background-position: 200px; }
}

Inner glow:
- Add pseudo-element ::after
- Position: Absolute, inset 4px
- Border: 1px solid rgba(255, 215, 0, 0.3)
- Border-radius: 16px
- Pointer-events: none

Files to create:
- components/ClockOrnament.jsx
- styles/clock-ornaments.css

Code reference: Custom enhancement (not in base implementation)
```

**Phase 2 Checkpoint:**
- [ ] Flip clock displays current time
- [ ] Digits update every second
- [ ] Flip animation triggers on change
- [ ] Golden frame with glow effects
- [ ] Ornamental decorations visible
- [ ] Clock remains centered on all screen sizes

---

### **PHASE 3: CAROUSELS (Day 3) - 6-8 hours**

**Objective:** Build dopamine widgets and market cards

#### **Task 3.1: Dopamine Widget Cards** ⏱️ 2.5 hours
```
Create 4 widget card types:

CARD 1 - ACTIVE BETS:
- Icon: 🎲 (dice emoji, 3rem)
- Title: "ACTIVE BETS" (cyan, 1rem, bold 900)
- Value: "3 LIVE" (gold, 1.2rem, bold 700)
- Border: 3px solid #FFD700
- Top accent: 4px gold gradient bar

CARD 2 - DEGEN STREAK:
- Icon: 🔥 (fire emoji, 3rem)
- Title: "DEGEN STREAK" (cyan)
- Value: "5 DAY STREAK!" (gold)
- Same border/accent styling

CARD 3 - CHAOS METER:
- Icon: ⚡ (lightning emoji, 3rem)
- Title: "CHAOS METER" (cyan)
- Value: "85% CHAOS" (gold)
- Same border/accent styling

CARD 4 - TOP GAINERS:
- Icon: 📈 (chart emoji, 3rem)
- Title: "TOP GAINERS" (cyan)
- Value: "UserA +50%\nUserB +30%" (gold, multi-line)
- Same border/accent styling

Universal card styling:
- Background: linear-gradient(135deg, #1a1a1a, #0a0a0a)
- Border: 3px solid #FFD700
- Border-radius: 16px
- Padding: 24px
- Text-align: center
- Box-shadow: 
  * Outer: 0 0 30px rgba(255, 215, 0, 0.4)
  * Inset: 0 2px 4px rgba(255, 215, 0, 0.2)

Top accent bar (::before):
- Position: Absolute top
- Height: 4px
- Background: linear-gradient(90deg, #FFD700, #FFA500, #FFD700)
- Width: 100%

Icon styling:
- Font-size: 3rem
- Margin: 16px 0
- Filter: drop-shadow(0 0 10px currentColor)

Files to create:
- components/DopamineCard.jsx
- components/ActiveBetsCard.jsx
- components/DegenStreakCard.jsx
- components/ChaosMeterCard.jsx
- components/TopGainersCard.jsx
- styles/dopamine-cards.css

Code reference: madhats-exact-design-v5.jsx lines 415-480
```

#### **Task 3.2: Carousel Container** ⏱️ 1.5 hours
```
Build carousel with navigation arrows

Container structure:
<div class="carousel-section">
  <h2 class="carousel-title">CUSTOMIZABLE DOPAMINE CAROUSEL</h2>
  <div class="carousel-container">
    <button class="carousel-arrow left">←</button>
    <div class="carousel-grid">
      {4 dopamine cards}
    </div>
    <button class="carousel-arrow right">→</button>
  </div>
</div>

Title styling:
- Font-size: 1.5rem
- Font-weight: 900
- Letter-spacing: 0.1em
- Color: #FFD700
- Margin-bottom: 20px
- Text-align: center

Grid layout:
- Display: grid
- Grid-template-columns: repeat(4, 1fr)
- Gap: 20px
- Max-width: 1200px
- Margin: 0 auto

Arrow buttons:
- Background: rgba(255, 215, 0, 0.2)
- Border: 2px solid #FFD700
- Border-radius: 50%
- Width: 50px
- Height: 50px
- Cursor: pointer
- Transition: all 0.3s

Arrow hover:
- Background: rgba(255, 215, 0, 0.4)
- Box-shadow: 0 0 20px rgba(255, 215, 0, 0.6)

Responsive:
- Desktop: 4 cards
- Tablet: 3 cards
- Mobile: 2 cards

Files to create:
- components/DopamineCarousel.jsx
- components/CarouselArrow.jsx
- styles/carousel.css

Code reference: madhats-exact-design-v5.jsx lines 485-530
```

#### **Task 3.3: Carousel Navigation Logic** ⏱️ 1.5 hours
```
Implement left/right arrow navigation

State management:
const [carouselIndex, setCarouselIndex] = useState(0);
const [visibleCards, setVisibleCards] = useState(4);

// Determine visible cards based on screen width
useEffect(() => {
  const updateVisibleCards = () => {
    if (window.innerWidth < 768) setVisibleCards(2);
    else if (window.innerWidth < 1280) setVisibleCards(3);
    else setVisibleCards(4);
  };
  
  updateVisibleCards();
  window.addEventListener('resize', updateVisibleCards);
  return () => window.removeEventListener('resize', updateVisibleCards);
}, []);

Navigation functions:
const goLeft = () => {
  setCarouselIndex(prev => Math.max(0, prev - 1));
};

const goRight = () => {
  const maxIndex = widgets.length - visibleCards;
  setCarouselIndex(prev => Math.min(maxIndex, prev + 1));
};

Carousel transform:
const offset = carouselIndex * (100 / visibleCards);
<div style={{ transform: `translateX(-${offset}%)` }}>

Disable arrows at boundaries:
- Left arrow: disabled when index === 0
- Right arrow: disabled when index === maxIndex

Animation:
- Transition: transform 0.4s ease-out
- Smooth slide effect

Files to update:
- components/DopamineCarousel.jsx (add navigation)

Code reference: Standard carousel pattern
```

#### **Task 3.4: Scroll Snap & Hover Effects** ⏱️ 1 hour
```
Add scroll snap and interactive effects

Scroll snap (mobile swipe):
.carousel-grid {
  scroll-snap-type: x mandatory;
  overflow-x: auto;
  scrollbar-width: none; /* Hide scrollbar */
}

.dopamine-card {
  scroll-snap-align: start;
}

Card hover effects:
.dopamine-card:hover {
  transform: translateY(-8px);
  border-color: #FFA500; /* Orange highlight */
  box-shadow: 0 0 40px rgba(255, 215, 0, 0.6);
}

Icon pulse on hover:
.dopamine-icon:hover {
  animation: iconPulse 0.6s ease-in-out;
}

@keyframes iconPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

Touch gestures (mobile):
- Swipe left/right to navigate
- Use Hammer.js or native touch events
- Snap to nearest card

Files to update:
- styles/dopamine-cards.css (add hover effects)
- styles/carousel.css (add scroll snap)

Code reference: Standard scroll snap pattern
```

**Phase 3 Checkpoint:**
- [ ] All 4 dopamine cards render correctly
- [ ] Carousel title displays
- [ ] Arrow buttons navigate left/right
- [ ] Cards slide smoothly
- [ ] Hover effects work
- [ ] Mobile: Swipe navigation functional
- [ ] Responsive: 4→3→2 cards

---

### **PHASE 4: MARKET CARDS (Day 4) - 4-6 hours**

**Objective:** Build featured prediction market cards

#### **Task 4.1: Market Card Component** ⏱️ 2 hours
```
Create market card with purple neon borders

Card structure:
<div class="market-card">
  <h3 class="market-question">{question}</h3>
  <div class="market-odds-label">YES / NO</div>
  <div class="market-odds">
    <span>{yesOdds}</span>
    <span>/</span>
    <span>{noOdds}</span>
  </div>
  <button class="market-bet-button">BET NOW</button>
</div>

Card styling:
- Background: #0a0a0a
- Border: 3px solid #9D4EDD (purple)
- Border-radius: 16px
- Padding: 30px 24px
- Text-align: center
- Box-shadow: 
  * Outer: 0 0 30px rgba(157, 78, 221, 0.6)
  * Inset: 0 2px 4px rgba(157, 78, 221, 0.2)

Question styling:
- Font-size: 1.3rem
- Font-weight: 900
- Color: #FFD700
- Margin-bottom: 20px
- Line-height: 1.3
- Text-transform: uppercase

Odds styling:
- Font-size: 1.5rem
- Font-weight: 900
- Color: #FFF
- Margin: 20px 0
- Display: flex
- Justify-content: center
- Gap: 20px

Button styling:
- Background: linear-gradient(135deg, #00FFFF, #00CED1)
- Border: none
- Border-radius: 8px
- Padding: 14px 40px
- Font-size: 1.1rem
- Font-weight: 900
- Color: #000
- Cursor: pointer
- Letter-spacing: 0.1em
- Box-shadow: 0 0 20px rgba(0, 255, 255, 0.6)
- Transition: all 0.3s

Button hover:
- Transform: translateY(-2px)
- Box-shadow: 0 0 30px rgba(0, 255, 255, 0.8)

Files to create:
- components/MarketCard.jsx
- styles/market-cards.css

Code reference: madhats-exact-design-v5.jsx lines 535-595
```

#### **Task 4.2: Market Data Integration** ⏱️ 1 hour
```
Create 3 featured markets with data

Market data structure:
const markets = [
  {
    id: 1,
    question: 'WILL ELON BUY ANOTHER COMPANY IN 2024?',
    yesOdds: '2.5x',
    noOdds: '1.4x'
  },
  {
    id: 2,
    question: 'BITCOIN TO HIT $100K BY EOY?',
    yesOdds: '1.9x',
    noOdds: '1.8x'
  },
  {
    id: 3,
    question: 'AI SURPASS HUMAN IQ BY 2030?',
    yesOdds: '3.0x',
    noOdds: '1.2x'
  }
];

Grid layout:
.markets-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

Responsive:
- Desktop: 3 columns
- Tablet: 2 columns
- Mobile: 1 column

Section title:
<h2 class="section-title">FEATURED MARKET CARDS</h2>

Title styling:
- Font-size: 1.5rem
- Font-weight: 900
- Letter-spacing: 0.1em
- Color: #FFD700
- Margin-bottom: 20px

Files to create:
- data/markets.js
- components/FeaturedMarkets.jsx

Code reference: madhats-exact-design-v5.jsx lines 600-640
```

#### **Task 4.3: Button Click Handlers** ⏱️ 1 hour
```
Wire up BET NOW buttons

Click handler:
const handleBetClick = (marketId) => {
  // TODO: Connect to betting system
  console.log('Betting on market:', marketId);
  
  // For now, show toast notification
  showToast(`Added market ${marketId} to bet slip`);
};

Button:
<button 
  class="market-bet-button"
  onClick={() => handleBetClick(market.id)}
>
  BET NOW
</button>

Toast notification system:
- Position: fixed bottom-right
- Background: #0a0a0a
- Border: 2px solid #00FFFF
- Padding: 16px 24px
- Border-radius: 8px
- Box-shadow: 0 0 30px rgba(0, 255, 255, 0.5)
- Animation: slideIn 0.3s
- Auto-dismiss: 3 seconds

Files to create:
- components/Toast.jsx
- utils/notifications.js
- styles/toast.css

Code reference: Standard toast pattern
```

**Phase 4 Checkpoint:**
- [ ] 3 market cards render correctly
- [ ] Purple neon borders with glow
- [ ] Questions display in gold
- [ ] Odds format correctly
- [ ] BET NOW buttons functional
- [ ] Toast notifications appear
- [ ] Responsive grid works

---

### **PHASE 5: NEWS SECTIONS (Day 5) - 4-6 hours**

**Objective:** Build celebrity news card sections

#### **Task 5.1: News Section Component** ⏱️ 2 hours
```
Create news card grid sections

Section structure:
<div class="news-section">
  <div class="news-header">
    <h2>News Politissh</h2>
    <button class="paginator">→</button>
  </div>
  <div class="news-grid">
    {news cards}
  </div>
</div>

News card:
<div class="news-card">
  <img src={imageUrl} alt={title} />
  <div class="news-badge">{category}</div>
  <h3>{headline}</h3>
  <div class="news-meta">
    <span>{source}</span>
    <span>{views} views</span>
    <span>{comments} comments</span>
  </div>
  <button class="news-button">News</button>
</div>

Card styling:
- Background: #1a1a1a
- Border: 1px solid #333
- Border-radius: 12px
- Overflow: hidden
- Transition: all 0.3s

Card hover:
- Border-color: #FFD700
- Box-shadow: 0 0 20px rgba(255, 215, 0, 0.4)
- Transform: translateY(-4px)

Image:
- Width: 100%
- Height: 200px
- Object-fit: cover

Badge (category):
- Position: Absolute top-left
- Background: rgba(0, 0, 0, 0.8)
- Color: #FFD700
- Padding: 4px 12px
- Border-radius: 0 0 8px 0
- Font-size: 0.75rem

Files to create:
- components/NewsSection.jsx
- components/NewsCard.jsx
- styles/news-sections.css

Code reference: From PNG, not in base implementation
```

#### **Task 5.2: Create Two News Sections** ⏱️ 1.5 hours
```
Build two sections from PNG:

SECTION 1: News Politissh
Cards:
1. Celebrity Drama Unfolds (red carpet image)
2. Royal Family Feud (Prince Harry image)

SECTION 2: Neon Noir Tabloid
Cards:
1. Kim Kardashian's New Boyfriend Revealed
2. Prince Harry and Meghan Explosive Interview
3. Prince Harry and Megan Marklen's Interview
4. Ridel Op-ed esque thing, Secott

News data structure:
const newsItems = [
  {
    id: 1,
    section: 'politissh',
    image: '/images/celebrity-drama.jpg',
    category: 'CELEBRITY',
    headline: 'Celebrity Drama Unfolds',
    source: 'Wikied Rececepts',
    views: '1.5M',
    comments: 254
  },
  // ... more items
];

Grid layout:
- 2 columns for Politissh section
- 4 columns for Tabloid section
- Gap: 16px

Files to create:
- data/news.js
- components/NewsPolitissh.jsx
- components/NeonNoirTabloid.jsx

Code reference: From PNG reference image
```

#### **Task 5.3: Pagination Logic** ⏱️ 1 hour
```
Add pagination for news sections

State:
const [currentPage, setCurrentPage] = useState(0);
const itemsPerPage = 4;

Pagination buttons:
<div class="news-pagination">
  <button onClick={goLeft} disabled={currentPage === 0}>
    ←
  </button>
  <span>{currentPage + 1} / {totalPages}</span>
  <button onClick={goRight} disabled={currentPage === totalPages - 1}>
    →
  </button>
</div>

Navigation:
const goLeft = () => setCurrentPage(prev => prev - 1);
const goRight = () => setCurrentPage(prev => prev + 1);

Display logic:
const startIndex = currentPage * itemsPerPage;
const visibleItems = newsItems.slice(startIndex, startIndex + itemsPerPage);

Files to update:
- components/NewsSection.jsx (add pagination)

Code reference: Standard pagination pattern
```

**Phase 5 Checkpoint:**
- [ ] Two news sections render
- [ ] Cards display with images
- [ ] Hover effects work
- [ ] Pagination buttons functional
- [ ] Badges show categories
- [ ] Meta info displays
- [ ] Responsive grid

---

## 🎨 DESIGN SYSTEM REFERENCE

### **Color Palette:**
```css
:root {
  /* Primary */
  --gold: #FFD700;
  --bronze: #B8860B;
  --orange: #FFA500;
  
  /* Secondary */
  --cyan: #00FFFF;
  --cyan-dark: #00CED1;
  --pink: #FF1493;
  --purple: #9D4EDD;
  
  /* Accent */
  --neon-green: #39FF14;
  
  /* Background */
  --black: #000000;
  --black-soft: #0a0a0a;
  --black-medium: #1a1a1a;
  --gray: #333333;
  --gray-light: #999999;
  
  /* Text */
  --text-primary: #FFFFFF;
  --text-secondary: #B8E5E1;
  --text-muted: #999999;
}
```

### **Typography Scale:**
```css
/* Headings */
--font-size-xl: 2.5rem;    /* Page titles */
--font-size-lg: 1.5rem;    /* Section titles */
--font-size-md: 1.3rem;    /* Card titles */
--font-size-base: 1rem;    /* Body text */
--font-size-sm: 0.85rem;   /* Small text */
--font-size-xs: 0.75rem;   /* Tiny text */

/* Special */
--font-size-clock: 3.5rem; /* Flip clock */

/* Weights */
--font-weight-normal: 400;
--font-weight-bold: 700;
--font-weight-black: 900;

/* Letter spacing */
--letter-spacing-tight: 0.05em;
--letter-spacing-wide: 0.1em;
--letter-spacing-wider: 0.15em;
```

### **Spacing Scale:**
```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 12px;
--spacing-lg: 16px;
--spacing-xl: 20px;
--spacing-2xl: 24px;
--spacing-3xl: 32px;
--spacing-4xl: 40px;
--spacing-5xl: 48px;
```

### **Border Radii:**
```css
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-2xl: 20px;
--radius-full: 9999px;
```

### **Shadows:**
```css
/* Glows */
--glow-gold: 0 0 20px rgba(255, 215, 0, 0.6);
--glow-gold-strong: 0 0 40px rgba(255, 215, 0, 0.8);
--glow-cyan: 0 0 20px rgba(0, 255, 255, 0.6);
--glow-purple: 0 0 30px rgba(157, 78, 221, 0.6);

/* Depth */
--shadow-sm: 0 2px 4px rgba(0,0,0,0.3);
--shadow-md: 0 4px 8px rgba(0,0,0,0.4);
--shadow-lg: 0 8px 16px rgba(0,0,0,0.5);

/* Insets */
--inset-sm: inset 0 2px 4px rgba(0,0,0,0.3);
--inset-md: inset 0 4px 8px rgba(0,0,0,0.4);
```

### **Animations:**
```css
/* Durations */
--duration-fast: 0.15s;
--duration-normal: 0.3s;
--duration-slow: 0.6s;

/* Easings */
--ease-out: ease-out;
--ease-in-out: ease-in-out;
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

---

## 📁 FILE STRUCTURE

```
madhats-gambit/
├── public/
│   ├── images/
│   │   ├── celebrity-drama.jpg
│   │   ├── royal-family.jpg
│   │   └── ...
│   └── index.html
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── RightSidebar.jsx
│   │   │   ├── MainContent.jsx
│   │   │   └── BottomNav.jsx
│   │   ├── tickers/
│   │   │   ├── CryptoTicker.jsx
│   │   │   └── MetricsBar.jsx
│   │   ├── clock/
│   │   │   ├── FlipClock.jsx
│   │   │   ├── FlipDigit.jsx
│   │   │   └── FlipSeparator.jsx
│   │   ├── carousel/
│   │   │   ├── DopamineCarousel.jsx
│   │   │   ├── DopamineCard.jsx
│   │   │   └── CarouselArrow.jsx
│   │   ├── markets/
│   │   │   ├── FeaturedMarkets.jsx
│   │   │   └── MarketCard.jsx
│   │   ├── news/
│   │   │   ├── NewsSection.jsx
│   │   │   └── NewsCard.jsx
│   │   └── common/
│   │       ├── Toast.jsx
│   │       └── SearchBar.jsx
│   ├── data/
│   │   ├── markets.js
│   │   └── news.js
│   ├── styles/
│   │   ├── global.css
│   │   ├── variables.css
│   │   ├── layout.css
│   │   ├── tickers.css
│   │   ├── flip-clock.css
│   │   ├── carousel.css
│   │   ├── market-cards.css
│   │   └── news-sections.css
│   ├── utils/
│   │   └── notifications.js
│   ├── App.jsx
│   └── index.js
└── package.json
```

---

## 🧪 TESTING CHECKLIST

### **Visual Testing:**
- [ ] Compare to PNG reference side-by-side
- [ ] Check colors match exactly (use color picker)
- [ ] Verify spacing/margins minimal as specified
- [ ] Test hover effects on all interactive elements
- [ ] Verify glow effects render correctly
- [ ] Check typography weights and sizes

### **Functional Testing:**
- [ ] Tickers scroll smoothly
- [ ] Clock updates every second
- [ ] Flip animation triggers on digit change
- [ ] Carousel arrows navigate correctly
- [ ] Market buttons show toast
- [ ] News pagination works
- [ ] Search bar accepts input
- [ ] Navigation highlights active section

### **Responsive Testing:**
- [ ] Desktop (1920px): All elements visible
- [ ] Laptop (1440px): Layout adjusts
- [ ] Tablet (1024px): Sidebars collapse
- [ ] Mobile (768px): Single column, hamburger menu
- [ ] Mobile (375px): Flip clock scales down
- [ ] Touch: Swipe gestures work
- [ ] Orientation: Landscape/portrait both work

### **Performance Testing:**
- [ ] Page loads in < 2 seconds
- [ ] Animations run at 60fps
- [ ] No memory leaks (check DevTools)
- [ ] Images optimized and lazy-loaded
- [ ] CSS animations GPU-accelerated
- [ ] No janky scrolling

### **Cross-Browser Testing:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

## 📦 DEPENDENCIES

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.263.1"
  },
  "devDependencies": {
    "vite": "^4.4.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
```

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] All components built and tested
- [ ] PNG reference comparison complete
- [ ] Responsive design verified
- [ ] Performance optimized
- [ ] Cross-browser tested
- [ ] Accessibility checked
- [ ] SEO meta tags added
- [ ] Favicon created
- [ ] Production build created
- [ ] Deploy to Vercel/Netlify
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Analytics integrated
- [ ] Error tracking setup

---

## 📚 REFERENCE MATERIALS

**Included in this package:**
1. `LandingPage_and_Dashbord_Layout_MADHATs.png` - Primary design mockup
2. `PNG_TO_IMPLEMENTATION_MAPPING.md` - Detailed design analysis
3. `MADHATS_WIREFRAME_SPECIFICATION.md` - Complete wireframe specs
4. `madhats-exact-design-v5.jsx` - Reference implementation
5. This document - Complete build guide

**External resources:**
- Flip clock animation: https://codepen.io/shshaw/pen/vKzoLL
- Scroll snap: https://css-tricks.com/practical-css-scroll-snapping/
- React carousel: https://github.com/leandrowd/react-responsive-carousel

---

## 💡 BEST PRACTICES

### **Code Quality:**
- Use semantic HTML5 elements
- Follow React best practices (hooks, composition)
- Keep components small and focused
- Use CSS modules or styled-components
- Implement proper prop-types or TypeScript
- Add meaningful comments

### **Performance:**
- Lazy load images
- Code-split routes
- Minimize bundle size
- Use production build
- Enable compression
- Optimize images (WebP)
- Use CDN for assets

### **Accessibility:**
- Semantic HTML structure
- ARIA labels where needed
- Keyboard navigation support
- Focus indicators visible
- Color contrast WCAG AA
- Screen reader tested

### **Maintainability:**
- Consistent naming conventions
- Modular component structure
- Clear file organization
- Documented complex logic
- Reusable utility functions
- Design system tokens

---

## 🎯 SUCCESS CRITERIA

**Project complete when:**
1. ✅ Visual design matches PNG 95%+
2. ✅ All features functional
3. ✅ Responsive on all devices
4. ✅ Performance scores >90 (Lighthouse)
5. ✅ No console errors
6. ✅ Cross-browser compatible
7. ✅ Deployed to production
8. ✅ Client approval received

---

**This build package provides everything needed to create a pixel-perfect implementation of the MADHATs Gambit landing page. Follow the phases sequentially for best results.** 🚀

Build started: {Current Date}  
Estimated completion: 3-5 days  
Status: **READY TO BUILD**
