# Invisible Load Reducer - Design Guidelines

## Brand Identity
**App Name:** Invisible Load Reducer  
**Tagline:** "Lighten your mind in 2 minutes."  
**Tone:** Empathetic, calming, non-judgmental  
**Target Audience:** Working moms seeking stress and mental load relief

## Visual Design Philosophy
The app MUST feel **STUNNING and CAPTIVATING** on first open with a **premium, modern, calming aesthetic**.

### Color & Visual Style
- **Soft gradients** throughout the UI
- **Calming color palette** (avoid harsh, bright colors)
- **Light + Dark mode support** (required)
- Card-based UI with **gentle shadows & rounded corners**

### Typography
- **Strong typography hierarchy**
- Clear, readable fonts suitable for stressed users
- Appropriate contrast in both light and dark modes

### Spacing & Layout
- **8pt grid system** for consistent spacing
- **Card-based UI** as primary layout pattern
- Gentle shadows on cards
- Rounded corners throughout

## Motion & Interaction Design

### Animations & Transitions
- **Subtle motion** (avoid jarring animations)
- **Smooth screen transitions** using Expo Router animations
- **Micro-interactions:**
  - Button press feedback
  - Card reveal animations
  - Progress animations
- **Animated breathing circle** in Reset mode (2-minute Mental Reset)
- **High performance** (no laggy or heavy animations)

### Feedback
- **Haptic feedback** on:
  - Save actions
  - Copy actions
  - Complete actions
- Visual feedback for all interactive elements

### Loading States
- **Reassuring loading messages:**
  - "Sorting your thoughts…"
  - "You're not alone."
  - Other empathetic, calming messages

## Screen-Specific Requirements

### Onboarding (3 screens)
1. **Screen 1:** "Your brain is doing too much."
2. **Screen 2:** "Dump it here. We'll sort it."
3. **Screen 3:** "Feel lighter — without guilt."
- Include **simple vector-style illustrations**
- Smooth transitions between screens

### Splash Screen
- **Polished splash screen** with app branding
- Quick load time

### Brain Dump Screen
- Text input for paragraph/stream of consciousness
- Clear visual feedback during AI processing
- Results displayed in structured sections:
  - **Today** (must do)
  - **Can wait**
  - **Delegate** (to partner/kids)
  - **Ignore** (without guilt)

### Guilt-Free Scripts Screen
- **Buttons for categories:** Partner, Kids, Boss, In-laws, Friends
- AI-generated scripts displayed as:
  - 5 short scripts
  - 3 longer versions
- **Copy button** for each script with haptic feedback
- Save to favorites functionality

### 2-Minute Mental Reset Mode
- **Animated breathing circle** (4-4-6 breathing pattern)
- **Guided flow with text:**
  - "Close this task"
  - "Breathe (4-4-6)"
  - "You are not lazy"
- **Animated timer** (2 minutes)
- Completion counter display

### Invisible Load Score Quiz
- **10 questions** with Likert scale (1–5)
- Clear question presentation
- **Shareable result card:**
  - "You're carrying XX% more load than average"
  - **Instagram/TikTok-worthy design**
  - Native share sheet integration

### Paywall/Unlock Screen
- Clear differentiation between free and paid features
- **Free tier limits:**
  - Brain Dump: 2 uses total
  - Mental Reset: 1 use
- **Unlocked features** clearly displayed
- $14 one-time purchase (non-subscription)
- Stripe Checkout integration (opens in web)

## Content & Messaging
- **Delightful but uncluttered** interface
- Empathetic messaging throughout
- No guilt-inducing language
- Reassuring, supportive tone in all copy
- Clear feature explanations

## Performance Requirements
- Fast load times
- Smooth animations (60 FPS target)
- Responsive interactions
- No laggy or heavy animations
- Optimized for battery life

## Technical UI Considerations
- Works in **Expo Go**
- Stripe opens in web view (not native)
- Secure token storage
- Local storage for offline functionality
- Professional **app icon** (SVG source + Expo sizes)