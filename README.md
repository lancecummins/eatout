# EatOut

A modern, cross-platform app that helps groups decide where to eat by asking "What do you NOT want to eat?"

## Features

- **Process of Elimination**: Users mark restaurants they don't want, making group decisions easier
- **Admin Controls**: Prioritize and favorite restaurants
- **Cross-Platform**: Web app and native mobile apps (iOS & Android)
- **Real-time Sync**: See group preferences update in real-time
- **Smart Recommendations**: Algorithm suggests 2-3 restaurants based on collective preferences
- **Universal Links**: Shareable links that work everywhere

## Architecture

This is a monorepo containing:

- `packages/shared` - Shared TypeScript code, Firebase integration, business logic
- `packages/web` - React web application
- `packages/mobile` - React Native (Expo) mobile app
- `firebase` - Firebase configuration and cloud functions

## Tech Stack

- **Frontend**: React, React Native (Expo), TypeScript, Tailwind CSS
- **Backend**: Firebase (Firestore, Hosting, Functions)
- **APIs**: Google Places API (New)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Firebase account with Google Places API enabled

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp packages/shared/.env.example packages/shared/.env
# Add your Firebase and Google Places API credentials

# Run web app
pnpm dev:web

# Run mobile app
pnpm dev:mobile
```

## Design

**Style**: Modern minimal with playful touches
**Colors**: Cool & modern (blues, purples, teals with neutral grays)
**Interactions**: Smooth animations, satisfying gestures, haptic feedback

## License

MIT
