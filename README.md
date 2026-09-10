# All API Frontend

A modern Next.js frontend for the All API project with OAuth authentication and dashboard functionality.

## Features

- **OAuth Authentication**: Secure login via Supabase Auth
- **Dashboard**: Account overview, statistics, and profile management
- **Proxy API**: Seamless integration with backend services
- **Health Monitoring**: Real-time health checks for API endpoints
- **Luma Store Developer Portal**: Open-source app submissions with a fully manual review and approval process
- **Submission Status Timeline**: Developers can see every submission status change and reviewer message
- **Developer Email Updates**: Developers receive emails when an app is submitted, enters review, is approved, is rejected, or receives a new reviewer message
- **Luma Store Approved Apps API**: Approved submissions are exposed publicly through `api/luma/apps`
- **Support Email Notifications**: Every support form message is stored in Supabase and forwarded by email through Resend
- **Responsive Design**: Mobile-friendly interface with dark theme

## Tech Stack

- **Next.js 16.3.1**: React framework with App Router
- **React 19.2.8**: UI library
- **TypeScript**: Type-safe development
- **Tailwind CSS 4**: Utility-first CSS framework
- **Supabase**: Authentication and application data
- **Resend**: Transactional email notifications

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase project
- Resend account for support and developer notifications

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

4. Apply the Supabase migration in `supabase/migrations/20260910_luma_submission_updates.sql`.

5. Configure the Supabase Database Webhook described below.

6. Run development server:
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

LUMA_STATUS_WEBHOOK_SECRET=replace-with-a-long-random-secret
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be exposed through a `NEXT_PUBLIC_*` variable.

`EMAIL_FROM` must use a sender/domain accepted by your Resend account. `EMAIL_NOTIFICATION_TO` is the inbox that receives a notification for every support form message.

`LUMA_STATUS_WEBHOOK_SECRET` protects the status notification endpoint. Use a long random value and configure the exact same value as the `x-luma-webhook-secret` header in Supabase.

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

Approved API entries also include public developer information from the submitter account. Private account data such as the developer's login email and user ID are not exposed by the public Store API.

## Developer submission status tracking

Apply:

```text
supabase/migrations/20260910_luma_submission_updates.sql
```

The migration adds:

```text
review_message
status_updated_at
approved_at
rejected_at
```

to `luma_submissions` and creates `luma_submission_status_history`.

A database trigger records an immutable timeline entry whenever a submission is created, its status changes, or its reviewer message changes. Developers can read only their own timeline through RLS.

The timeline UI is available at:

```text
/dashboard/developer/status
```

It shows the current status, last update time, latest reviewer message, and the complete timeline for every submitted app.

### Developer email notifications

Create a Supabase Database Webhook for the table:

```text
public.luma_submissions
```

Enable these events:

```text
INSERT
UPDATE
```

Point it to your deployed endpoint:

```text
POST https://api.free-time.me/api/luma/status-webhook
```

Add this HTTP header to the webhook:

```text
x-luma-webhook-secret: <the same value as LUMA_STATUS_WEBHOOK_SECRET>
```

The webhook sends the developer an email when:

- a new app is submitted (`Pending`)
- the app moves to `In Review`
- the app is `Approved`
- the app is `Rejected`
- the reviewer message changes

The developer email address is resolved server-side using the submission's `user_id` and the Supabase service-role client. The address is never added to the public Luma Store API.

Reviewer notes can be written to `luma_submissions.review_message`. For rejected submissions this can be used to explain what needs to be fixed before resubmission.

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
│   ├── luma/apps/            # Public approved Luma Store submissions
│   ├── luma/submissions/     # Authenticated developer submission API
│   ├── luma/status-webhook/  # Supabase status-change email webhook
│   ├── support/              # Support ticket + email notification endpoint
│   ├── health/               # Health endpoint
│   ├── payment/              # Payment verification
│   └── proxy/                # API proxy
├── components/               # React components
├── dashboard/
│   └── developer/status/     # Developer submission timeline
├── auth/                     # Auth pages
└── login/                    # Login page

lib/
├── email/                    # Server-side Resend email provider
└── supabase/                 # Browser, server and admin Supabase clients

supabase/
└── migrations/               # Database migrations for Luma submission tracking
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Configure all values from `.env.example` as environment variables
4. Apply the Supabase migration
5. Configure the Supabase Database Webhook
6. Deploy

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
- The Luma status webhook is protected by a secret request header
- Developer email addresses and Supabase user IDs are not exposed in the public Luma Store API
- Status history is protected with Row Level Security
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

### Developer status email issues

If status changes are visible in Supabase but no developer email arrives:
1. Confirm the Database Webhook is enabled for both INSERT and UPDATE
2. Confirm its URL is `/api/luma/status-webhook`
3. Confirm the `x-luma-webhook-secret` header exactly matches `LUMA_STATUS_WEBHOOK_SECRET`
4. Check `SUPABASE_SERVICE_ROLE_KEY`
5. Check `RESEND_API_KEY` and `EMAIL_FROM`
6. Review the Supabase webhook logs and Resend delivery logs

## License

Private project - All rights reserved
