# 🎨 MADHATs Gambit — COMPLETE WIREFRAME SPECIFICATION
**Version**: 5.0 Retro Seiko Edition  
**Date**: February 17, 2026  
**Theme**: Verdigris Flash with Retro Seiko Clock Integration

---

## 📐 LAYOUT GRID SYSTEM

### **Master Grid Specifications:**
```
Desktop (1920px):
├─ News Ticker: 100% width × 48px height
├─ Header: 100% width × 72px height
├─ Main Layout: 100% width × calc(100vh - 180px)
│  ├─ Sidebar: 260px fixed width
│  ├─ Main Content: flex-1 (remaining space)
│  └─ Right Panel: 340px fixed width (optional)
└─ Footer: 100% width × 60px height

Tablet (768px-1280px):
├─ News Ticker: 100% × 44px
├─ Header: 100% × 64px
├─ Main Layout:
│  ├─ Sidebar: 220px (collapsible)
│  └─ Main Content: flex-1
└─ Footer: 100% × auto

Mobile (375px-768px):
├─ News Ticker: 100% × 40px
├─ Header: 100% × 56px
├─ Main Layout:
│  ├─ Sidebar: 280px (overlay, off-canvas)
│  └─ Main Content: 100%
└─ Footer: 100% × auto (stacked columns)
```

### **Spacing System (8px base unit):**
```
XXS: 4px    (micro spacing)
XS:  8px    (tight spacing)
SM:  12px   (compact spacing)
MD:  16px   (default spacing)
LG:  24px   (comfortable spacing)
XL:  32px   (section spacing)
XXL: 48px   (major section breaks)
```

---

## 🎯 SECTION 1: NEWS TICKER (Top Bar)

### **Dimensions:**
```
Desktop:  100% × 48px
Tablet:   100% × 44px
Mobile:   100% × 40px
```

### **Structure:**
```
┌─────────────────────────────────────────────────────────┐
│ [Icon] SOURCE • News headline text scrolls here...      │
│ [Icon] SOURCE • Another headline continues...           │
└─────────────────────────────────────────────────────────┘
```

### **Layout Specifications:**
- **Background**: `rgba(10, 31, 30, 0.95)` (Verdigris dark)
- **Border Bottom**: `2px solid #43B3AE` (Verdigris primary)
- **Padding**: `0` (no padding, full bleed)
- **Overflow**: `hidden` (clips scrolling content)

### **Content Track:**
- **Display**: `flex`
- **Gap**: `64px` (desktop), `48px` (tablet), `32px` (mobile)
- **Animation**: `tickerScroll 60s linear infinite`
- **Duplicate**: Content array × 2 for seamless loop

### **Ticker Item:**
- **Structure**: `[Emoji Icon] [SOURCE (bold)] • [Headline Text]`
- **Font Size**: `0.85rem` (desktop), `0.8rem` (tablet), `0.75rem` (mobile)
- **Source Color**: `#5FFBF1` (Verdigris flash)
- **Text Color**: `#B8E5E1` (Secondary text)
- **Icon Size**: `16px` (desktop), `14px` (mobile)

### **Margins:**
- **Top**: `0`
- **Bottom**: `0`
- **Left/Right**: `0`
- **Internal Padding**: `10px 0` (vertical only)

---

## 🎯 SECTION 2: HEADER BAR

### **Dimensions:**
```
Desktop:  100% × 72px
Tablet:   100% × 64px
Mobile:   100% × 56px
```

### **Structure:**
```
┌──────────────────────────────────────────────────────────┐
│ [☰] MADHATS GAMBIT         [🔔][💬][WALLET] [CLOCK]     │
└──────────────────────────────────────────────────────────┘
```

### **Layout Grid:**
```css
display: grid;
grid-template-columns: auto 1fr auto auto auto;
align-items: center;
padding: 0 16px; /* Minimal horizontal padding */
gap: 12px;
```

### **Component Breakdown:**

#### **2A. Hamburger Menu** (Mobile Only)
- **Size**: `40px × 40px`
- **Position**: `flex-start`
- **Background**: `linear-gradient(135deg, #5FFBF1, #7DFFFA)`
- **Border**: `2px solid #7DFFFA`
- **Border Radius**: `8px`
- **Icon**: Menu (24px)
- **Margin**: `0` (controlled by gap)
- **Display**: `none` on desktop/tablet, `flex` on mobile

#### **2B. Logo**
- **Text**: "MADHATS GAMBIT"
- **Font**: Bebas Neue, 2rem (desktop), 1.75rem (tablet), 1.5rem (mobile)
- **Background**: `linear-gradient(135deg, #5FFBF1, #7DFFFA, #FFF)`
- **-webkit-background-clip**: `text`
- **Letter Spacing**: `0.15em`
- **Margin**: `0`
- **Text Shadow**: `0 0 30px rgba(125, 255, 250, 0.5)`

#### **2C. Spacer**
- **Grid Column**: Spans to fill space
- **Content**: Empty (flex filler)

#### **2D. Notification Bell**
- **Size**: `40px × 40px` (button)
- **Icon**: Bell (20px)
- **Badge**: Red circle (16px) with count
- **Badge Position**: `absolute top: -4px, right: -4px`
- **Margin**: `0`

#### **2E. Chat Button**
- **Size**: `40px × 40px`
- **Icon**: MessageCircle (20px)
- **Margin**: `0`

#### **2F. Wallet Button**
- **Padding**: `10px 20px` (desktop), `8px 16px` (tablet), `8px 12px` (mobile)
- **Font Size**: `0.85rem` (desktop), `0.8rem` (tablet), `0.75rem` (mobile)
- **Min Width**: `120px` (desktop), `100px` (mobile)
- **Background**: `linear-gradient(135deg, #5FFBF1, #7DFFFA)`
- **Border**: `2px solid #7DFFFA`
- **Border Radius**: `8px`
- **Margin**: `0`

#### **2G. RETRO SEIKO ANALOG CLOCK** ⏰ **NEW**
- **Size**: `56px × 56px` (desktop), `48px × 48px` (tablet), `44px × 44px` (mobile)
- **Position**: Far right of header
- **Design**: Circular analog clock face
- **Margin**: `0 0 0 12px`

**Clock Face Design:**
```
┌─────────────┐
│      12     │
│   9     3   │
│      6      │
│  [MADHATS]  │
└─────────────┘

Specifications:
- Outer Circle: 2px solid #43B3AE (Verdigris)
- Inner Circle: 1px solid rgba(95, 251, 241, 0.3)
- Background: radial-gradient(circle, rgba(26,69,67,0.8) 0%, rgba(10,31,30,0.9) 100%)
- Hour Markers: 12 small dots (#5FFBF1), 4px each
- Hour Hand: 3px wide, #FFD700 (gold), rounded tip
- Minute Hand: 2px wide, #5FFBF1 (flash), rounded tip
- Second Hand: 1px wide, #DC143C (crimson), sharp tip
- Center Pin: 6px circle, #7DFFFA with glow
- Brand Text: "MADHATS" in 6px Orbitron, bottom
- Glow Effect: 0 0 20px rgba(95, 251, 241, 0.6)
```

**Clock Functionality:**
```javascript
// Real-time clock update
setInterval(() => {
  const now = new Date();
  const hours = now.getHours() % 12;
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  
  hourHand.style.transform = `rotate(${hours * 30 + minutes * 0.5}deg)`;
  minuteHand.style.transform = `rotate(${minutes * 6}deg)`;
  secondHand.style.transform = `rotate(${seconds * 6}deg)`;
}, 1000);
```

### **Header Margins:**
- **Top**: `0`
- **Bottom**: `0`
- **Left**: `16px`
- **Right**: `16px`
- **Internal Gap**: `12px` (between all items)

---

## 🎯 SECTION 3: SIDEBAR (Left Navigation)

### **Dimensions:**
```
Desktop:  260px × calc(100vh - 120px)
Tablet:   220px × calc(100vh - 108px)
Mobile:   280px × 100vh (full-height overlay)
```

### **Structure:**
```
┌──────────────────┐
│ [Icon] Dashboard │ ← Active (highlighted)
│ [Icon] Markets   │
│ [Icon] Cards     │
│ [Icon] Staking   │
│ [Icon] Tourneys  │
│ [Icon] Profile   │
│ [Icon] Settings  │
└──────────────────┘
```

### **Layout Specifications:**
- **Background**: `rgba(10, 31, 30, 0.95)` (Verdigris menu)
- **Border Right**: `2px solid #2A6F6C` (Verdigris dark)
- **Padding**: `20px 8px` (minimal horizontal)
- **Overflow-Y**: `auto` (scroll if needed)
- **Z-Index**: `200` (mobile overlay)

### **Navigation Item:**
```css
Structure:
┌─────────────────────────┐
│ [Icon(18px)] Label      │ ← 12px gap between icon and text
└─────────────────────────┘

Dimensions:
- Padding: 12px 12px (minimal, tight)
- Margin: 4px 0 (vertical only)
- Border Radius: 8px
- Border: 1px solid transparent
- Font Size: 0.85rem
- Line Height: 1
- Min Height: 44px (touch target)
```

### **Navigation States:**

**Default:**
- Background: `transparent`
- Color: `#B8E5E1` (Secondary text)
- Border: `1px solid transparent`

**Hover:**
- Background: `rgba(67, 179, 174, 0.1)`
- Color: `#5FFBF1` (Verdigris flash)
- Border: `1px solid #43B3AE`
- Transform: `none` (no lift)

**Active:**
- Background: `linear-gradient(135deg, rgba(95, 251, 241, 0.2), rgba(125, 255, 250, 0.1))`
- Color: `#7DFFFA` (Verdigris torsion)
- Border: `1px solid #7DFFFA`
- Box Shadow: `0 0 20px rgba(95, 251, 241, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)`

### **Sidebar Margins:**
- **Top**: `0`
- **Bottom**: `0`
- **Left**: `0`
- **Right**: `0`
- **Internal Padding**: `20px 8px`
- **Item Spacing**: `4px` vertical margin only

### **Mobile Behavior:**
```css
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    box-shadow: 4px 0 20px rgba(0,0,0,0.5);
  }
  
  .sidebar.open {
    transform: translateX(0);
  }
}
```

---

## 🎯 SECTION 4: MAIN CONTENT AREA

### **Dimensions:**
```
Desktop:  flex-1 (remaining space after sidebar)
Tablet:   flex-1
Mobile:   100%
```

### **Structure:**
```
┌─────────────────────────────────────────┐
│ [Page Title - 2.5rem Bebas Neue]        │
│                                          │
│ [Content Grid - Responsive]             │
│   ┌────────┬────────┬────────┬────────┐ │
│   │ Card 1 │ Card 2 │ Card 3 │ Card 4 │ │
│   └────────┴────────┴────────┴────────┘ │
│                                          │
│   ┌────────────────┬──────────────────┐ │
│   │ Section Left   │ Section Right    │ │
│   └────────────────┴──────────────────┘ │
└─────────────────────────────────────────┘
```

### **Layout Specifications:**
- **Background**: `rgba(10, 31, 30, 0.3)` (Subtle tint)
- **Padding**: `32px` (desktop), `24px` (tablet), `16px` (mobile)
- **Overflow-Y**: `auto`
- **Min-Height**: `calc(100vh - 180px)`

### **Content Grid System:**

#### **Stats Grid (4 columns):**
```css
display: grid;
grid-template-columns: repeat(4, 1fr);
gap: 20px;

/* Tablet */
@media (max-width: 1280px) {
  grid-template-columns: repeat(2, 1fr);
}

/* Mobile */
@media (max-width: 768px) {
  grid-template-columns: 1fr;
  gap: 16px;
}
```

#### **Market Grid (2-3 columns):**
```css
display: grid;
grid-template-columns: repeat(3, 1fr);
gap: 20px;

/* Tablet */
@media (max-width: 1280px) {
  grid-template-columns: repeat(2, 1fr);
}

/* Mobile */
@media (max-width: 768px) {
  grid-template-columns: 1fr;
  gap: 16px;
}
```

### **Card Component (Glass Card):**
```
┌─────────────────────────┐
│ [Title/Icon]            │
│                         │
│ [Content Area]          │
│                         │
│ [Action Button]         │
└─────────────────────────┘

Dimensions:
- Padding: 24px (desktop), 20px (tablet), 16px (mobile)
- Border: 1px solid #43B3AE
- Border Radius: 14px
- Background: rgba(26, 69, 67, 0.6)
- Backdrop Filter: blur(16px)
- Box Shadow: 0 8px 32px rgba(0, 0, 0, 0.4)
```

### **Main Content Margins:**
- **Top**: `0`
- **Bottom**: `0`
- **Left**: `0`
- **Right**: `0`
- **Internal Padding**: `32px` (desktop), `24px` (tablet), `16px` (mobile)
- **Card Grid Gap**: `20px` (desktop/tablet), `16px` (mobile)

---

## 🎯 SECTION 5: BET SLIP (Right Panel/Bottom Sheet)

### **Dimensions:**
```
Desktop:  340px × auto (fixed right)
Tablet:   320px × auto (fixed right)
Mobile:   100% × 50vh (bottom sheet)
```

### **Structure:**
```
┌────────────────────────┐
│ Bet Slip (3) [X]       │ ← Header
├────────────────────────┤
│ ┌──────────────────┐   │
│ │ Market Title     │   │ ← Bet Card 1
│ │ YES @ 73%        │   │
│ │ [Amount: 100]    │   │
│ │ Win: +180 $MADx  │   │
│ └──────────────────┘   │
│                        │
│ ┌──────────────────┐   │
│ │ Market Title     │   │ ← Bet Card 2
│ └──────────────────┘   │
├────────────────────────┤
│ Total: 200 $MADx       │ ← Summary
│ Return: +360 $MADx     │
│ [PLACE 2 BETS]         │
└────────────────────────┘
```

### **Position:**
```css
/* Desktop/Tablet */
position: fixed;
right: 24px;
top: 180px; /* Below header + ticker */
max-height: calc(100vh - 200px);
z-index: 50;

/* Mobile */
@media (max-width: 768px) {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  top: auto;
  max-height: 50vh;
}
```

### **Layout Specifications:**
- **Background**: `rgba(10, 31, 30, 0.95)` (Verdigris menu)
- **Border**: `2px solid #43B3AE`
- **Border Radius**: `12px` (desktop/tablet), `12px 12px 0 0` (mobile)
- **Padding**: `20px` (desktop), `16px` (mobile)
- **Box Shadow**: `0 0 40px rgba(95, 251, 241, 0.5)`
- **Overflow-Y**: `auto`

### **Bet Slip Margins:**
- **Top**: `180px` (desktop position from top)
- **Right**: `24px` (desktop)
- **Bottom**: `0` (mobile bottom-sheet)
- **Left**: `0` (mobile full-width)
- **Internal Padding**: `20px` (desktop), `16px` (mobile)
- **Card Spacing**: `12px` between bet cards

---

## 🎯 SECTION 6: GLOBAL CHAT (Optional Panel)

### **Dimensions:**
```
Desktop:  320px × 400px
Tablet:   300px × 360px
Mobile:   100% × 50vh
```

### **Position:**
```css
/* Desktop */
position: fixed;
right: 380px; /* When bet slip present */
bottom: 24px;
z-index: 100;

/* Mobile */
@media (max-width: 768px) {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50vh;
}
```

### **Structure:**
```
┌────────────────────┐
│ Global Chat [X]    │ ← Header (16px padding)
├────────────────────┤
│ 🎩 You: Message    │ ← Message 1
│ 👑 User: Reply     │ ← Message 2
│ 🐋 User: Text      │ ← Message 3
│                    │ ← Scrollable area
│                    │
├────────────────────┤
│ [Input] [Send]     │ ← Footer (12px padding)
└────────────────────┘
```

### **Layout Specifications:**
- **Background**: `rgba(10, 31, 30, 0.95)`
- **Border**: `2px solid #43B3AE`
- **Border Radius**: `12px`
- **Display**: `flex` `flex-direction: column`
- **Header Padding**: `16px`
- **Message Area Padding**: `12px`
- **Footer Padding**: `12px`

### **Chat Margins:**
- **All External**: `0` (position controlled by fixed placement)
- **Internal Sections**: `0` margin, padding only
- **Message Spacing**: `12px` gap between messages

---

## 🎯 SECTION 7: FOOTER

### **Dimensions:**
```
Desktop:  100% × 60px
Tablet:   100% × auto (min 80px)
Mobile:   100% × auto (stacked)
```

### **Structure:**
```
┌──────────────────────────────────────────────────┐
│ Platform    Community    Legal    MADHATs Logo   │
│ • Markets   • Discord    • Terms  © 2026         │
│ • Cards     • Twitter    • Privacy               │
└──────────────────────────────────────────────────┘
```

### **Layout Grid:**
```css
display: grid;
grid-template-columns: repeat(4, 1fr);
gap: 32px;
padding: 24px 32px;

/* Tablet */
@media (max-width: 1024px) {
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

/* Mobile */
@media (max-width: 768px) {
  grid-template-columns: 1fr;
  gap: 20px;
  padding: 20px 16px;
}
```

### **Layout Specifications:**
- **Background**: `rgba(10, 31, 30, 0.98)` (Verdigris footer)
- **Border Top**: `2px solid #43B3AE`
- **Padding**: `24px 32px` (desktop), `20px 16px` (mobile)

### **Footer Column:**
- **Heading**: 
  - Font Size: `0.9rem`
  - Color: `#5FFBF1` (Verdigris flash)
  - Font Weight: `700`
  - Margin Bottom: `12px`
- **Link**:
  - Font Size: `0.8rem`
  - Color: `#B8E5E1` (Secondary)
  - Line Height: `2`
  - Display: `block`
  - Margin: `0`

### **Footer Margins:**
- **Top**: `0`
- **Bottom**: `0`
- **Left**: `32px` (desktop), `16px` (mobile)
- **Right**: `32px` (desktop), `16px` (mobile)
- **Internal Column Gap**: `32px` (desktop), `24px` (tablet), `20px` (mobile)

---

## 🎯 SECTION 8: MODAL OVERLAYS

### **Dimensions:**
```
Full Screen Overlay: 100vw × 100vh
Modal Content: max-width 600px × auto
```

### **Structure:**
```
┌────────────────────────────────────┐
│ [Dark Overlay - rgba(0,0,0,0.9)]  │
│                                    │
│    ┌──────────────────────┐       │
│    │ [X] Modal Title      │       │
│    │                      │       │
│    │ [Modal Content]      │       │
│    │                      │       │
│    │ [Action Buttons]     │       │
│    └──────────────────────┘       │
└────────────────────────────────────┘
```

### **Layout Specifications:**

**Overlay:**
- Position: `fixed`
- Inset: `0`
- Background: `rgba(0, 0, 0, 0.9)`
- Display: `flex`
- Align Items: `center`
- Justify Content: `center`
- Z-Index: `1000`

**Modal Content:**
- Max Width: `600px` (desktop), `90vw` (mobile)
- Padding: `32px` (desktop), `24px` (mobile)
- Background: `rgba(26, 69, 67, 0.95)`
- Border: `2px solid #43B3AE`
- Border Radius: `16px`
- Box Shadow: `0 0 60px rgba(95, 251, 241, 0.6)`

### **Modal Margins:**
- **External**: `0` (centered by flexbox)
- **Internal Padding**: `32px` (desktop), `24px` (mobile)
- **Content Spacing**: `20px` between sections

---

## 🎯 SECTION 9: TOAST NOTIFICATIONS

### **Dimensions:**
```
Desktop:  auto × auto (max-width 400px)
Mobile:   calc(100% - 32px) × auto
```

### **Position:**
```css
position: fixed;
bottom: 24px;
right: 24px;
z-index: 1000;

/* Mobile */
@media (max-width: 768px) {
  bottom: 16px;
  right: 16px;
  left: 16px;
}
```

### **Structure:**
```
┌────────────────────────────┐
│ [Icon] Message Text        │
└────────────────────────────┘

Success: Green border (#39FF14)
Error: Red border (#DC143C)
Info: Cyan border (#00FFFF)
```

### **Layout Specifications:**
- **Padding**: `16px 24px` (desktop), `12px 20px` (mobile)
- **Border**: `2px solid [type-color]`
- **Border Radius**: `8px`
- **Background**: `rgba(10, 31, 30, 0.95)`
- **Box Shadow**: `0 0 30px rgba(95, 251, 241, 0.5)`
- **Animation**: `slideIn 0.3s ease-out`

### **Toast Margins:**
- **External**: Controlled by fixed position
- **Internal Padding**: `16px 24px` (desktop), `12px 20px` (mobile)
- **Icon-Text Gap**: `8px`

---

## 📊 COMPLETE SPACING MATRIX

### **Component Spacing (All in px):**

| Component | Desktop Padding | Tablet Padding | Mobile Padding | Margins |
|-----------|----------------|----------------|----------------|---------|
| **News Ticker** | `10px 0` | `10px 0` | `10px 0` | `0` |
| **Header** | `0 16px` | `0 16px` | `0 12px` | `0` |
| **Sidebar** | `20px 8px` | `20px 8px` | `20px 12px` | `0` |
| **Nav Item** | `12px 12px` | `12px 12px` | `12px 12px` | `4px 0` |
| **Main Content** | `32px` | `24px` | `16px` | `0` |
| **Glass Card** | `24px` | `20px` | `16px` | `0` (grid gap handles) |
| **Bet Slip** | `20px` | `20px` | `16px` | `0` (fixed position) |
| **Chat Panel** | `16px/12px` | `16px/12px` | `12px` | `0` |
| **Footer** | `24px 32px` | `24px 24px` | `20px 16px` | `0` |
| **Modal** | `32px` | `24px` | `24px` | `0` (centered) |
| **Toast** | `16px 24px` | `16px 24px` | `12px 20px` | `0` |

### **Grid Gaps:**
| Grid Type | Desktop | Tablet | Mobile |
|-----------|---------|--------|--------|
| **Stats (4-col)** | `20px` | `20px` | `16px` |
| **Markets (3-col)** | `20px` | `20px` | `16px` |
| **Cards (3-col)** | `20px` | `20px` | `16px` |
| **Footer (4-col)** | `32px` | `24px` | `20px` |

---

## 🎨 RETRO SEIKO CLOCK - COMPLETE SPECIFICATIONS

### **Visual Design:**
```
     12
   ┌────┐
 9 │    │ 3
   │  • │
   └────┘
      6
  MADHATS
```

### **SVG Component:**
```jsx
const RetroSeikoCloc = () => {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  const hours = time.getHours() % 12;
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  
  const hourAngle = (hours * 30) + (minutes * 0.5);
  const minuteAngle = minutes * 6;
  const secondAngle = seconds * 6;
  
  return (
    <svg width="56" height="56" viewBox="0 0 100 100">
      {/* Outer Circle */}
      <circle cx="50" cy="50" r="48" 
        fill="url(#clockGradient)" 
        stroke="#43B3AE" 
        strokeWidth="2" />
      
      {/* Gradient Definition */}
      <defs>
        <radialGradient id="clockGradient">
          <stop offset="0%" stopColor="rgba(26,69,67,0.8)" />
          <stop offset="100%" stopColor="rgba(10,31,30,0.9)" />
        </radialGradient>
        <filter id="clockGlow">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>
      
      {/* Hour Markers */}
      {[...Array(12)].map((_, i) => {
        const angle = (i * 30 - 90) * Math.PI / 180;
        const x = 50 + 38 * Math.cos(angle);
        const y = 50 + 38 * Math.sin(angle);
        return (
          <circle key={i} cx={x} cy={y} r="2" 
            fill="#5FFBF1" filter="url(#clockGlow)" />
        );
      })}
      
      {/* Hour Hand */}
      <line x1="50" y1="50" x2="50" y2="30"
        stroke="#FFD700" strokeWidth="3" 
        strokeLinecap="round"
        transform={`rotate(${hourAngle} 50 50)`} />
      
      {/* Minute Hand */}
      <line x1="50" y1="50" x2="50" y2="20"
        stroke="#5FFBF1" strokeWidth="2" 
        strokeLinecap="round"
        transform={`rotate(${minuteAngle} 50 50)`} />
      
      {/* Second Hand */}
      <line x1="50" y1="50" x2="50" y2="15"
        stroke="#DC143C" strokeWidth="1" 
        strokeLinecap="round"
        transform={`rotate(${secondAngle} 50 50)`} />
      
      {/* Center Pin */}
      <circle cx="50" cy="50" r="3" 
        fill="#7DFFFA" 
        filter="url(#clockGlow)" />
      
      {/* Brand Text */}
      <text x="50" y="75" 
        textAnchor="middle" 
        fontSize="6" 
        fill="#5FFBF1" 
        fontFamily="Orbitron"
        fontWeight="700">
        MADHATS
      </text>
    </svg>
  );
};
```

### **Clock Positioning:**
- **Desktop Header**: Far right, `margin-left: 12px`
- **Tablet Header**: Far right, `margin-left: 12px`
- **Mobile Header**: Hidden (save space), OR show in dashboard

### **Alternative Clock Positions:**
1. **Header** (default) - Always visible timestamp
2. **Dashboard Card** - Larger version (120px × 120px) as widget
3. **Market Countdown** - Shows time until market closes

---

## 🎯 OPTIMIZATION RULES

### **Margin Minimization:**
```css
/* DO THIS ✅ */
.container {
  padding: 32px; /* Use padding for internal spacing */
}

.grid {
  gap: 20px; /* Use gap for grid spacing */
}

/* DON'T DO THIS ❌ */
.card {
  margin: 20px; /* Avoid margins, use grid gap instead */
}
```

### **Spacing Consolidation:**
1. **Use Grid Gap** instead of card margins
2. **Use Padding** for internal component spacing
3. **Use Flexbox Gap** for inline elements
4. **Set Margin: 0** on all structural elements
5. **Control spacing** at the container level, not child level

### **Mobile Optimization:**
- **Reduce All Padding** by 25-50% on mobile
- **Use Bottom Sheets** instead of modals
- **Stack Columns** to single column
- **Increase Touch Targets** to 44px minimum
- **Reduce Font Sizes** by 10-15%

---

## 📋 BUILD CHECKLIST

### **Phase 1: Structure** ✅
- [ ] Create news ticker with scrolling animation
- [ ] Build header with Retro Seiko clock
- [ ] Implement sidebar navigation (7 items)
- [ ] Setup main content area with responsive grid
- [ ] Add footer with 4-column layout

### **Phase 2: Components** ✅
- [ ] Build glass card component
- [ ] Create market card with flash-UI hover
- [ ] Implement bet slip (right panel/bottom sheet)
- [ ] Add global chat panel
- [ ] Build modal overlay system
- [ ] Create toast notification system

### **Phase 3: Features** ✅
- [ ] Wire all navigation links
- [ ] Connect wallet button (4 states)
- [ ] Implement notification dropdown
- [ ] Add chat send functionality
- [ ] Build bet slip cart system
- [ ] Create favorites system

### **Phase 4: Polish** ✅
- [ ] Apply Verdigris Flash theme globally
- [ ] Add VerdigrisTorsion Flash-UI to high-touch
- [ ] Optimize all spacing/margins
- [ ] Test all responsive breakpoints
- [ ] Add all animations
- [ ] Implement LocalStorage persistence

---

## 🚀 READY TO BUILD

This wireframe specification provides **exact measurements, spacing, margins, and layout rules** for every section of the MADHATs Gambit platform, including the new **Retro Seiko analog clock** integration.

**Key Optimizations:**
- ✅ Minimal margins (most set to `0`)
- ✅ Grid gap controls spacing
- ✅ Padding for internal spacing
- ✅ All measurements in 8px increments
- ✅ Complete responsive specifications
- ✅ Retro Seiko clock fully designed

---

**Upload your PNG reference image and I'll refine this wireframe to match it exactly.** 📐

Document Hash: `madhats-wireframe-retro-seiko-feb17-2026`  
Status: **READY TO BUILD**
