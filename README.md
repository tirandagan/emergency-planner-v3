This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Google Cloud Setup

The application uses several Google Cloud APIs for map functionality. You'll need to:

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable billing for the project

2. **Enable Required APIs**

   Navigate to **APIs & Services → Library** and enable:

   **Required for Maps & Evacuation Routes:**
   - **Maps JavaScript API** - For rendering interactive maps
   - **Geocoding API** - For converting waypoint names to coordinates
   - **Routes API** - For computing drivable routes with waypoints

   **Additional APIs** (if using other features):
   - Directions API
   - Places API (New)
   - Places API
   - Custom Search API
   - YouTube Data API v3

3. **Create API Key**
   - Go to **APIs & Services → Credentials**
   - Click **Create Credentials → API Key**
   - Copy the API key to `.env.local`:
     ```bash
     NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY=your_api_key_here
     ```
   - Recommended: Restrict the API key to your domain for production use

4. **Verify Setup**
   - After enabling APIs, it may take a few minutes for changes to propagate
   - Check browser console for any API-related error messages
   - Error messages will indicate which specific API needs to be enabled

## Version Management

The application version is tracked in `package.json` and displayed in the Admin Console footer.

### Updating Version

You can automatically bump the version using the following commands:

- **Patch** (Bug fixes): `5.0.1` -> `5.0.2`
  ```bash
  npm run version:patch
  ```

- **Minor** (New features): `5.0.1` -> `5.1.0`
  ```bash
  npm run version:minor
  ```

- **Major** (Breaking changes): `5.0.1` -> `6.0.0`
  ```bash
  npm run version:major
  ```

These commands will update `package.json` automatically.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
