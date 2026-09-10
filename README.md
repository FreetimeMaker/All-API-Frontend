# All API Frontend

A modern Next.js frontend for the All API project with OAuth authentication and dashboard functionality.

## Features

- **OAuth Authentication**: Secure login via Supabase Auth
- **Dashboard**: Account overview, statistics, and profile management
- **Proxy API**: Seamless integration with backend services
- **Health Monitoring**: Real-time health checks for API endpoints
- **Luma Store Developer Portal**: Open-source app submissions with a fully manual review and approval process
- **Luma Store Approved Apps API**: Approved submissions are exposed publicly through `api/luma/apps`
- **Support Email Notifications**: Every support form message is stored in Supabase and forwarded by email through Resend
- **Responsive Design**: Mobile-friendly interface with dark theme

## Tech Stack

- **Next.js 16.3.1**: React framework with App Router
- **React 19.2.8**: UI library
- **TypeScript**: Type-safe development
- **Tailwind CSS 4**: Utility-first CSS framework
- **Supabase**: Authentication and application data
- **Resend**: Transactional support email notifications

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase project
- Resend account for support notifications

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
   Edit `.env` and configure the values shown below.

4. Run development server:
   ```bash
   npm run dev
   ```

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
API_BASE=https://api.free-time.me

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

RESEND_API_KEY=re_your_api_key
EMAIL_FROM=Luma Support <support@your-verified-domain.example>
EMAIL_NOTIFICATION_TO=FreetimeMaker@proton.me
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be exposed through a `NEXT_PUBLIC_*` variable.

`EMAIL_FROM` must use a sender/domain accepted by your Resend account. `EMAIL_NOTIFICATION_TO` is the inbox that receives a notification for every support form message.

## Luma Store publishing

Luma Store submissions are intentionally handled manually. Source code, licensing, app information and publishing requirements are reviewed by a person before the submission status is changed.

Only rows in `luma_submissions` whose status is exactly `Approved` are exposed by the public endpoint:

```text
GET /api/luma/apps
```

At the production domain this is:

```text
https://api.free-time.me/api/luma/apps
```

Pending, In Review and Rejected submissions are not returned by this endpoint. The API includes `publishingMode: "manual-review"` so clients can identify the publishing workflow.

## Support notifications

The support form posts to:

```text
POST /api/support
```

The server validates the signed-in user, stores the request in the `support_tickets` Supabase table, and then sends an email notification through Resend. The email provider credentials remain server-side and are never exposed to the browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript without emitting files

## Project Structure

```text
app/
├── api/
│   ├── luma/apps/     # Public approved Luma Store submissions
│   ├── support/       # Support ticket + email notification endpoint
│   ├── health/        # Health endpoint
│   ├── payment/       # Payment verification
│   └── proxy/         # API proxy
├── components/        # React components
├── dashboard/         # Dashboard pages
├── auth/              # Auth pages
└── login/             # Login page

lib/
├── email/             # Server-side email provider
└── supabase/          # Browser, server and admin Supabase clients
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Configure all values from `.env.example` as environment variables
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

- Supabase authentication is handled through the configured client/server helpers
- The Supabase service-role key is only used server-side
- Resend credentials are only used server-side
- Health checks before API calls
- Proxy for secure API communication
- Environment variable configuration

## Troubleshooting

### Build Issues

If you encounter build errors:
1. Clear Next.js cache: `rm -rf .next`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check TypeScript errors: `npm run type-check`

### Authentication Issues

If OAuth fails:
1. Check `API_BASE` is correct
2. Verify OAuth provider settings
3. Check browser console for errors
4. Ensure callback URLs are configured

### Support email issues

If a support ticket is stored but no email arrives:
1. Check `RESEND_API_KEY`
2. Verify the domain/sender used in `EMAIL_FROM`
3. Check `EMAIL_NOTIFICATION_TO`
4. Review the Resend delivery logs

## License

Private project - All rights reserved
