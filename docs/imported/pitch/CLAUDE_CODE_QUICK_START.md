# 🚀 CLAUDE CODE QUICK START

## IMMEDIATE ACTIONS

### **1. Review All Materials (10 min)**
```bash
# You have access to these files:
/mnt/user-data/uploads/LandingPage_and_Dashbord_Layout_MADHATs.png
/mnt/user-data/outputs/CLAUDE_CODE_BUILD_PACKAGE.md
/mnt/user-data/outputs/PNG_TO_IMPLEMENTATION_MAPPING.md
/mnt/user-data/outputs/MADHATS_WIREFRAME_SPECIFICATION.md
/mnt/user-data/outputs/madhats-exact-design-v5.jsx
```

### **2. Create Project (5 min)**
```bash
# Initialize React project
npx create-react-app madhats-gambit
cd madhats-gambit

# Install dependencies
npm install lucide-react

# Clean up
rm src/App.css src/logo.svg src/App.test.js
```

### **3. Start Building (Phase 1)**
```bash
# Create folder structure
mkdir -p src/components/{layout,tickers,clock,carousel,markets,news,common}
mkdir -p src/styles
mkdir -p src/data
mkdir -p src/utils

# Start with tickers (Task 1.1)
# See CLAUDE_CODE_BUILD_PACKAGE.md Phase 1, Task 1.1
```

---

## 📋 DAY-BY-DAY PLAN

### **Day 1: Structure**
**Morning (4 hours):**
- Task 1.1: Crypto Ticker (45 min)
- Task 1.2: Header Bar (1 hour)
- Task 1.3: Left Sidebar (1.5 hours)
- Task 1.4: Right Sidebar (1.5 hours)

**Afternoon (3 hours):**
- Task 1.5: Main Content Grid (1 hour)
- Task 1.6: Bottom Nav (45 min)
- Testing & refinement (1 hour 15 min)

### **Day 2: Flip Clock**
**Morning (4 hours):**
- Task 2.1: Clock Structure (2 hours)
- Task 2.2: Flip Animation (2 hours)

**Afternoon (3 hours):**
- Task 2.3: Real-Time Connection (1 hour)
- Task 2.4: Ornate Borders (1.5 hours)
- Testing & refinement (30 min)

### **Day 3: Carousels**
**Morning (4 hours):**
- Task 3.1: Dopamine Cards (2.5 hours)
- Task 3.2: Carousel Container (1.5 hours)

**Afternoon (3 hours):**
- Task 3.3: Navigation Logic (1.5 hours)
- Task 3.4: Scroll Snap & Hover (1 hour)
- Testing & refinement (30 min)

### **Day 4: Markets**
**Morning (3 hours):**
- Task 4.1: Market Card Component (2 hours)
- Task 4.2: Market Data Integration (1 hour)

**Afternoon (2 hours):**
- Task 4.3: Button Click Handlers (1 hour)
- Testing & refinement (1 hour)

### **Day 5: News (Optional)**
**Full Day (6 hours):**
- Task 5.1: News Section Component (2 hours)
- Task 5.2: Create Two Sections (1.5 hours)
- Task 5.3: Pagination Logic (1 hour)
- Final testing & polish (1.5 hours)

---

## ⚡ SPEED TIPS

### **Copy-Paste Ready:**
Most components have reference code in `madhats-exact-design-v5.jsx`. You can:
1. Copy entire component
2. Extract to separate file
3. Adjust as needed

### **Use Design Tokens:**
Create `src/styles/variables.css` first with all colors/spacing. Reference everywhere.

### **Component Template:**
```jsx
import React from 'react';
import './ComponentName.css';

export default function ComponentName() {
  return (
    <div className="component-name">
      {/* Content */}
    </div>
  );
}
```

### **CSS Template:**
```css
.component-name {
  /* Layout */
  /* Colors */
  /* Typography */
  /* Effects */
}

.component-name:hover {
  /* Hover state */
}

@media (max-width: 768px) {
  .component-name {
    /* Mobile adjustments */
  }
}
```

---

## 🎯 PRIORITY ORDER

If time is limited, build in this order:

**Must Have (MVP):**
1. ✅ Tickers (both bars)
2. ✅ Header
3. ✅ Flip Clock
4. ✅ Sidebars (left + right)
5. ✅ Market Cards

**Should Have:**
6. ✅ Dopamine Carousel
7. ✅ Bottom Nav
8. ✅ Responsive design

**Nice to Have:**
9. News sections
10. Advanced animations
11. News pagination

---

## 🔧 COMMON ISSUES & FIXES

### **Issue: Flip clock animation jitters**
**Fix:** Use `will-change: transform` and `transform-style: preserve-3d`

### **Issue: Ticker doesn't loop smoothly**
**Fix:** Duplicate ticker items and use `animation-iteration-count: infinite`

### **Issue: Sidebars overlap on mobile**
**Fix:** Use `position: fixed` with `transform: translateX(-100%)` for hidden state

### **Issue: Colors don't match PNG exactly**
**Fix:** Use eyedropper tool on PNG to get exact hex values

### **Issue: Spacing looks wrong**
**Fix:** Check if you're using margin instead of grid gap

---

## 📞 CHECKPOINT QUESTIONS

After each phase, verify:

**Phase 1:**
- [ ] Can you see both ticker bars scrolling?
- [ ] Is the header centered with search bar?
- [ ] Do both sidebars show all items?
- [ ] Does the main content area have proper margins?
- [ ] Is bottom nav visible and styled?

**Phase 2:**
- [ ] Does the clock show current time?
- [ ] Do digits update every second?
- [ ] Is the golden frame visible with glow?
- [ ] Does the flip animation trigger?
- [ ] Are separators positioned correctly?

**Phase 3:**
- [ ] Do all 4 dopamine cards display?
- [ ] Are gold borders visible with glow?
- [ ] Do carousel arrows work?
- [ ] Does the carousel slide smoothly?
- [ ] Do cards respond to hover?

**Phase 4:**
- [ ] Do all 3 market cards show?
- [ ] Are purple borders glowing?
- [ ] Do BET NOW buttons work?
- [ ] Are odds formatted correctly?
- [ ] Does toast notification appear?

---

## 🚀 GO TIME!

**You're ready to build. Start with Phase 1, Task 1.1.**

Open `CLAUDE_CODE_BUILD_PACKAGE.md` and follow the detailed instructions.

Good luck! 🎰
