# Invisible Load Reducer

**App Name:** Invisible Load Reducer  
**Tagline:** "Lighten your mind in 2 minutes."  
**Target Audience:** Working moms seeking stress and mental load relief

## Overview

A mental wellness mobile app that helps working moms manage their mental load through:
- AI-powered brain dump task sorting
- Guilt-free communication scripts
- 2-minute guided mental resets with breathing exercises
- Mental load score quiz with shareable results

## Tech Stack

- **Frontend:** Expo React Native (TypeScript)
- **Backend:** Express.js (TypeScript)
- **Database:** PostgreSQL with Drizzle ORM
- **AI:** OpenAI via Replit AI Integrations
- **Payments:** Stripe Checkout ($14 one-time)
- **Auth:** JWT-based authentication

## Project Structure

```
├── client/              # Expo React Native app
│   ├── components/      # Reusable UI components
│   ├── constants/       # Theme (colors, spacing, typography)
│   ├── contexts/        # AuthContext for authentication
│   ├── hooks/           # useTheme, useScreenOptions, etc.
│   ├── lib/             # API client, query client
│   ├── navigation/      # React Navigation setup
│   └── screens/         # All app screens
├── server/              # Express.js backend
│   ├── replit_integrations/  # AI batch processing utilities
│   ├── db.ts            # Database connection
│   ├── routes.ts        # All API endpoints
│   ├── storage.ts       # Database operations (Drizzle)
│   └── index.ts         # Server entry point
├── shared/              # Shared between client/server
│   └── schema.ts        # Drizzle schema (users, sessions, etc.)
└── assets/              # App icons and images
```

## Key Files

- `client/contexts/AuthContext.tsx` - Authentication state management
- `client/navigation/RootStackNavigator.tsx` - Main navigation with onboarding/auth gates
- `client/navigation/MainTabNavigator.tsx` - Bottom tab navigator
- `server/routes.ts` - All API endpoints (auth, AI, payments)
- `shared/schema.ts` - Database schema
- `client/constants/theme.ts` - Design tokens (colors, spacing)

## Database Schema

- `users` - User accounts with email, premium status, usage counts
- `sessions` - JWT session tokens
- `brain_dumps` - Brain dump history with categorized tasks
- `favorites` - Saved scripts and content
- `resets` - Mental reset completion records
- `scores` - Quiz score history
- `purchases` - Stripe payment records

## API Endpoints

### Auth
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/me` - Get current user with usage info

### AI Features
- `POST /api/brain-dump` - Process brain dump with AI
- `POST /api/scripts` - Generate guilt-free scripts
- `POST /api/reset` - Record mental reset completion
- `POST /api/score` - Calculate quiz score

### Payments
- `POST /api/purchases/checkout-session` - Create Stripe session
- `POST /api/verify-purchase` - Verify payment
- `POST /webhooks/stripe` - Stripe webhook

## Free Tier Limits

- Brain Dumps: 2 total
- Mental Resets: 1 total
- Scripts: Require premium
- Quiz History: Require premium
- Favorites: Require premium

## Design System

### Colors (from theme.ts)
- Primary: Lavender purple (#8B7BB8)
- Secondary: Mint green (#7BBBA8)
- Backgrounds: Soft cream/lavender tones
- Light/dark mode support

### Spacing (8pt grid)
- xs: 4, sm: 8, md: 12, lg: 16, xl: 20, 2xl: 24, etc.

### Components
- `ThemedText` - Typography with type variants
- `ThemedView` - Themed backgrounds
- `Button` - Primary action button with spring animation
- `Card` - Elevated card with press feedback
- `KeyboardAwareScrollViewCompat` - Keyboard avoidance

## Running Locally

1. Start workflow: `npm run dev`
2. Backend runs on port 5000
3. Expo runs on port 8081
4. Scan QR code with Expo Go

## Environment Variables Required

- `DATABASE_URL` - PostgreSQL connection
- `AI_INTEGRATIONS_OPENAI_API_KEY` - OpenAI API key
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - OpenAI base URL
- `SESSION_SECRET` - Session encryption key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret

## Recent Changes

- Initial MVP implementation (Dec 2025)
- Onboarding flow with 3 screens
- Brain Dump with AI task sorting
- Scripts generator for 5 categories
- 2-minute mental reset with animated breathing
- Load score quiz with shareable results
- Stripe payment integration
- JWT authentication

## User Preferences

- Calming, empathetic design
- No emojis in the app
- Soft gradients and gentle animations
- Non-judgmental, supportive messaging
