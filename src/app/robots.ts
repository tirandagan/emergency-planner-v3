import { MetadataRoute } from 'next';

/**
 * Generates robots.txt file for search engine crawlers
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://beprepared.ai';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/admin/',
          '/plans/',
          '/profile/',
          '/inventory/',
          '/bundles/',
          '/skills/',
          '/expert-calls/',
          '/readiness/',
          '/consulting/booking/',
          '/consulting/my-bookings/',
          '/auth/callback',
          '/auth/verify-email',
          '/auth/verify-manual',
          '/auth/reset-password',
          '/auth/reset-password-success',
          '/_next/',
          '/wizard-test',
          '/auth/login-test',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
