# IMPORTANT

## Now under [Website](https://github.com/FreetimeMaker/Multi-Node-Apps/tree/main/API-Dashboard)

# All API Frontend

A modern Next.js frontend for the All API project with OAuth authentication and dashboard functionality.

## Features

- **OAuth Authentication**: Secure login via Supabase Auth
- **Dashboard**: Account overview, statistics, and profile management
- **Proxy API**: Seamless integration with backend services
- **Health Monitoring**: Real-time health checks for API endpoints
- **Responsive Design**: Mobile-friendly interface with dark theme

## Tech Stack

- **Next.js 16.3.1**: React framework with App Router
- **React 19.2.8**: UI library
- **TypeScript**: Type-safe development
- **Tailwind CSS 4**: Utility-first CSS framework

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and configure your API_BASE URL

4. Run development server:
   ```bash
   npm run dev
   ```

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
API_BASE=https://your-api-domain.com
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
app/
├── api/              # API routes
│   ├── auth/         # Authentication endpoints
│   ├── session/      # Session management
│   └── proxy/        # API proxy
├── components/       # React components
├── dashboard/        # Dashboard pages
├── auth/             # Auth pages
└── login/            # Login page
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Other Platforms

Build the project:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## Security

- OAuth tokens stored in localStorage
- Health checks before API calls
- Proxy for secure API communication
- Environment variable configuration

See [SECURITY.md](SECURITY.md) for detailed security information.

## Troubleshooting

### Build Issues

If you encounter build errors:
1. Clear Next.js cache: `rm -rf .next`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check TypeScript errors: `npx tsc --noEmit`

### Authentication Issues

If OAuth fails:
1. Check API_BASE is correct
2. Verify OAuth provider settings
3. Check browser console for errors
4. Ensure callback URLs are configured

## License

Private project - All rights reserved
