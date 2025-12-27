# Invisible Load Reducer

**Lighten your mind in 2 minutes.**

A mental wellness app for working moms to reduce stress and mental load through AI-powered task sorting, guilt-free communication scripts, guided breathing exercises, and mental load assessments.

## Features

### Core Features

1. **Brain Dump → AI Task Sorting**
   - Type out your overwhelmed thoughts
   - AI categorizes into: Today, Can Wait, Delegate, Ignore
   - Save session history

2. **Guilt-Free Scripts Generator**
   - Scripts for: Partner, Kids, Boss, In-laws, Friends
   - 5 short scripts + 3 longer versions per category
   - Copy button for each script
   - Save favorites (Premium)

3. **2-Minute Mental Reset Mode**
   - Guided breathing flow (4-4-6 pattern)
   - Animated breathing circle
   - Reassuring affirmations
   - Track completed resets

4. **Invisible Load Score Quiz**
   - 10-question Likert scale assessment
   - Score 0-100 with comparison to average
   - Shareable result card

### Monetization

- **Free tier:**
  - 2 Brain Dumps total
  - 1 Mental Reset
- **Premium ($14 one-time):**
  - Unlimited Brain Dumps
  - Unlimited Scripts
  - Unlimited Resets
  - Quiz history
  - Favorites

## Tech Stack

### Mobile (Expo React Native)
- React Native with Expo SDK
- TypeScript
- React Navigation 7
- TanStack React Query
- Reanimated for animations
- AsyncStorage for local persistence

### Backend (Express.js)
- Node.js + Express
- TypeScript
- PostgreSQL with Drizzle ORM
- JWT authentication
- OpenAI API (via Replit AI Integrations)
- Stripe Checkout for payments

## Project Structure

```
├── client/                 # Expo React Native app
│   ├── components/         # Reusable UI components
│   ├── constants/          # Theme, colors, spacing
│   ├── contexts/           # React contexts (Auth)
│   ├── hooks/              # Custom hooks
│   ├── lib/                # API client, utilities
│   ├── navigation/         # React Navigation setup
│   └── screens/            # App screens
├── server/                 # Express.js backend
│   ├── replit_integrations/# AI integration modules
│   ├── templates/          # Landing page HTML
│   ├── db.ts              # Database connection
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database operations
│   └── index.ts           # Server entry point
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Drizzle ORM schema
└── assets/                 # App icons and images
```

## Environment Variables

### Required for Development

```bash
# Database (auto-provisioned by Replit)
DATABASE_URL=postgresql://...

# OpenAI (auto-configured by Replit AI Integrations)
AI_INTEGRATIONS_OPENAI_API_KEY=...
AI_INTEGRATIONS_OPENAI_BASE_URL=...

# Session (generate a random string)
SESSION_SECRET=your-secret-key

# Stripe (get from Stripe Dashboard)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL database
- Expo Go app on your phone

### Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd invisible-load-reducer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy the required variables above
   - Add to `.env` file or Replit Secrets

4. **Push database schema**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Test on your phone**
   - Open Expo Go
   - Scan QR code from the Replit URL bar

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/me` - Get current user

### Features
- `POST /api/brain-dump` - Process brain dump
- `GET /api/brain-dump/history` - Get history
- `POST /api/scripts` - Generate scripts
- `POST /api/reset` - Record reset
- `GET /api/reset/count` - Get reset count
- `POST /api/score` - Submit quiz score
- `GET /api/score/history` - Get score history

### Favorites
- `POST /api/favorites` - Save favorite
- `GET /api/favorites` - Get favorites
- `DELETE /api/favorites/:id` - Delete favorite

### Payments
- `POST /api/purchases/checkout-session` - Create Stripe session
- `POST /api/verify-purchase` - Verify purchase
- `POST /webhooks/stripe` - Stripe webhook

### Health
- `GET /health` - Health check

## Stripe Setup

1. **Create Stripe account** at stripe.com

2. **Get API keys** from Dashboard → Developers → API keys
   - Use test keys for development
   - Add `STRIPE_SECRET_KEY` to environment

3. **Set up webhook** at Dashboard → Developers → Webhooks
   - Endpoint URL: `https://your-domain.com/webhooks/stripe`
   - Events: `checkout.session.completed`
   - Add `STRIPE_WEBHOOK_SECRET` to environment

4. **Test payment flow**
   - Use test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any CVC

## Deployment

### Replit Deployment

1. Click "Deploy" button in Replit
2. Replit handles:
   - Building the app
   - Setting up the server
   - SSL/TLS certificates
   - Health checks

### Render Deployment

1. **Create render.yaml**
   ```yaml
   services:
     - type: web
       name: invisible-load-reducer
       runtime: node
       buildCommand: npm install && npm run build
       startCommand: npm start
       envVars:
         - key: DATABASE_URL
           fromDatabase:
             name: invisible-load-reducer-db
             property: connectionString
         - key: SESSION_SECRET
           generateValue: true
         - key: STRIPE_SECRET_KEY
           sync: false
         - key: STRIPE_WEBHOOK_SECRET
           sync: false
         - key: AI_INTEGRATIONS_OPENAI_API_KEY
           sync: false
         - key: AI_INTEGRATIONS_OPENAI_BASE_URL
           sync: false

   databases:
     - name: invisible-load-reducer-db
       databaseName: invisible_load_reducer
       plan: free
   ```

2. **Deploy to Render**
   - Push code to GitHub
   - Connect GitHub repo to Render
   - Deploy

3. **Configure environment variables**
   - Add all required secrets in Render Dashboard

## EAS Build (Android AAB for Play Store)

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**
   ```bash
   eas login
   ```

3. **Configure project**
   ```bash
   eas build:configure
   ```

4. **Create production build**
   ```bash
   eas build --platform android --profile production
   ```

5. **Download AAB file**
   - Get the `.aab` file from the EAS dashboard
   - Upload to Google Play Console

## Git Commands

```bash
# Initialize repository
git init
git add .
git commit -m "Initial commit: Invisible Load Reducer MVP"

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/invisible-load-reducer.git

# Push to GitHub
git push -u origin main
```

## QA Checklist

### Payment Flow
- [ ] Create account
- [ ] Hit free tier limit
- [ ] Click upgrade
- [ ] Complete Stripe checkout (use test card)
- [ ] Verify premium status updated
- [ ] Confirm unlimited access

### Webhook
- [ ] Stripe webhook receives events
- [ ] User upgraded after successful payment
- [ ] Purchase recorded in database

### Feature Limits
- [ ] Brain Dump limited to 2 for free users
- [ ] Reset limited to 1 for free users
- [ ] Scripts require premium
- [ ] Favorites require premium

### AI Integration
- [ ] Brain Dump returns categorized tasks
- [ ] Scripts generate for all categories
- [ ] Rate limiting works

### Build
- [ ] App starts without errors
- [ ] All screens render correctly
- [ ] Navigation works
- [ ] Animations smooth
- [ ] Light/dark mode works

## License

MIT License - Feel free to use and modify.

---

Built with love for working moms everywhere. You're doing enough.
