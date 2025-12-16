import React from 'react';
import { LegalPageLayout } from '@/components/legal/LegalPageLayout';
import { LegalSection } from '@/components/legal/LegalSection';
import { TableOfContents } from '@/components/legal/TableOfContents';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy | Be Prepared',
  description: 'Cookie Policy for Be Prepared - Learn about the cookies we use and how to manage your preferences.',
};

export default function CookiePolicyPage() {
  const tocItems = [
    { id: 'what-are-cookies', title: '1. What Are Cookies?' },
    { id: 'cookies-we-use', title: '2. Cookies We Use' },
    { id: 'third-party-cookies', title: '3. Third-Party Cookies' },
    { id: 'managing-cookies', title: '4. Managing Your Cookie Preferences' },
    { id: 'cookie-details', title: '5. Detailed Cookie Information' },
    { id: 'changes', title: '6. Changes to This Cookie Policy' },
    { id: 'contact', title: '7. Contact Us' },
  ];

  return (
    <LegalPageLayout
      title="Cookie Policy"
      lastUpdated="December 10, 2025"
    >
      <TableOfContents items={tocItems} />

      {/* What Are Cookies */}
      <LegalSection
        id="what-are-cookies"
        title="1. What Are Cookies?"
        summary="Cookies are small text files stored on your device when you visit websites. They help websites remember your preferences and understand how you use the site. They don't harm your device and can't access other files on your computer."
      >
        <p>
          Cookies are small text files that are placed on your computer or mobile device when you 
          visit a website. Cookies are widely used by website owners to make their websites work, 
          or to work more efficiently, as well as to provide reporting information.
        </p>
        <p className="mt-4">
          <strong>What cookies do:</strong>
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Remember your login status and preferences</li>
          <li>Help us understand how you use our Service</li>
          <li>Enable certain features and functionality</li>
          <li>Improve your experience by remembering your choices</li>
          <li>Allow us to analyze website traffic and performance</li>
        </ul>
        <p className="mt-4">
          <strong>What cookies do NOT do:</strong>
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Harm your device or access other files on your computer</li>
          <li>Install viruses or malware</li>
          <li>Directly identify you by name without other information</li>
          <li>Access your personal files or sensitive data</li>
        </ul>
      </LegalSection>

      {/* Cookies We Use */}
      <LegalSection
        id="cookies-we-use"
        title="2. Cookies We Use"
        summary="We use essential cookies (required for login and core features), analytics cookies (Google Analytics to understand usage), and may use marketing cookies in the future. You can choose to accept or decline non-essential cookies through our cookie consent banner."
      >
        <p>
          Be Prepared uses different types of cookies to provide and improve our Service. We categorize 
          our cookies as follows:
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Essential Cookies (Always Active)</h3>
        <div className="p-4 bg-primary/10 border-l-4 border-primary rounded-r mb-4">
          <p className="text-sm font-medium text-primary mb-1">
            🔒 Required for Service Functionality
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed">
            These cookies are necessary for the Service to function properly and cannot be disabled 
            without affecting core functionality.
          </p>
        </div>
        <p>
          <strong>Purpose:</strong> Essential cookies enable critical features including:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li><strong>Authentication:</strong> Keep you logged in as you navigate between pages</li>
          <li><strong>Session Management:</strong> Maintain your active session and security state</li>
          <li><strong>Security:</strong> Prevent unauthorized access and protect against attacks</li>
          <li><strong>Form Functionality:</strong> Remember form inputs during multi-step processes</li>
          <li><strong>Cookie Consent:</strong> Remember your cookie preferences</li>
        </ul>
        <p className="mt-3">
          <strong>Duration:</strong> Essential cookies are typically session cookies (deleted when you 
          close your browser) or short-term cookies (expire after a few days to a few months).
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Analytics Cookies (Optional - Requires Consent)</h3>
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r mb-4">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
            📊 Help Us Improve the Service
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
            These cookies help us understand how users interact with our Service so we can improve it. 
            You can decline these cookies through our cookie consent banner.
          </p>
        </div>
        <p>
          <strong>Purpose:</strong> Analytics cookies help us:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Understand which pages and features are most popular</li>
          <li>Identify areas where users experience difficulties</li>
          <li>Measure the effectiveness of our Service and improvements</li>
          <li>Analyze user behavior patterns to optimize the user experience</li>
          <li>Track conversion rates and signup funnel performance</li>
        </ul>
        <p className="mt-3">
          <strong>Service Used:</strong> Google Analytics
        </p>
        <p className="mt-3">
          <strong>Duration:</strong> Analytics cookies may persist for up to 2 years.
        </p>
        <p className="mt-3">
          <strong>Your Choice:</strong> You can accept or decline analytics cookies through our cookie 
          consent banner. Declining analytics cookies will not affect your ability to use the Service.
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">2.3 Marketing Cookies (Optional - Requires Consent)</h3>
        <p>
          We may use marketing cookies in the future to:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Show you relevant content based on your interests</li>
          <li>Remember your preferences for personalized experiences</li>
          <li>Track the effectiveness of marketing campaigns</li>
        </ul>
        <p className="mt-3">
          <strong>Your Choice:</strong> Marketing cookies require your explicit consent. You can manage 
          these preferences through our cookie consent banner.
        </p>
      </LegalSection>

      {/* Third-Party Cookies */}
      <LegalSection
        id="third-party-cookies"
        title="3. Third-Party Cookies"
        summary="Third-party services like Google Analytics and Stripe may set cookies on your device. These services have their own privacy policies. We use Google Analytics to understand website usage (optional with your consent) and Stripe for secure payment processing (essential)."
      >
        <p>
          In addition to our own cookies, we use cookies from trusted third-party services to help 
          us operate and improve the Service:
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Google Analytics</h3>
        <p>
          <strong>Type:</strong> Analytics Cookies (Optional - Requires Consent)
        </p>
        <p className="mt-2">
          <strong>Purpose:</strong> Google Analytics helps us understand how visitors use our Service, 
          including which pages are visited, how long users stay, and where users come from.
        </p>
        <p className="mt-2">
          <strong>Data Collected:</strong>
        </p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>Pages viewed and time spent on each page</li>
          <li>Referring websites and search terms</li>
          <li>Browser type, device type, and screen resolution</li>
          <li>Geographic location (city/region level only)</li>
          <li>Click patterns and navigation paths</li>
        </ul>
        <p className="mt-3">
          <strong>Privacy:</strong> Google Analytics does not collect personally identifiable information. 
          We have configured Google Analytics to anonymize IP addresses.
        </p>
        <p className="mt-3">
          <strong>Opt-Out:</strong> You can decline Google Analytics cookies through our cookie consent 
          banner, or use the Google Analytics Opt-out Browser Add-on:{' '}
          <a 
            href="https://tools.google.com/dlpage/gaoptout" 
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://tools.google.com/dlpage/gaoptout
          </a>
        </p>
        <p className="mt-3">
          <strong>Privacy Policy:</strong>{' '}
          <a 
            href="https://policies.google.com/privacy" 
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://policies.google.com/privacy
          </a>
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Stripe</h3>
        <p>
          <strong>Type:</strong> Essential Cookies (Required for Payment Processing)
        </p>
        <p className="mt-2">
          <strong>Purpose:</strong> Stripe is our payment processor and uses cookies to securely process 
          subscription payments and prevent fraud.
        </p>
        <p className="mt-2">
          <strong>Data Collected:</strong>
        </p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>Payment card information (securely encrypted)</li>
          <li>Billing address and contact information</li>
          <li>Transaction details and payment history</li>
          <li>Device information for fraud detection</li>
        </ul>
        <p className="mt-3">
          <strong>Security:</strong> Stripe is PCI-DSS compliant and uses industry-leading security 
          measures to protect payment data.
        </p>
        <p className="mt-3">
          <strong>Privacy Policy:</strong>{' '}
          <a 
            href="https://stripe.com/privacy" 
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://stripe.com/privacy
          </a>
        </p>
        <p className="mt-3">
          <strong>Note:</strong> Stripe cookies are necessary for payment processing and cannot be 
          disabled if you want to subscribe to paid plans.
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">3.3 Supabase</h3>
        <p>
          <strong>Type:</strong> Essential Cookies (Required for Authentication)
        </p>
        <p className="mt-2">
          <strong>Purpose:</strong> Supabase provides our authentication system and uses cookies to 
          maintain your logged-in session.
        </p>
        <p className="mt-2">
          <strong>Data Collected:</strong>
        </p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>Session tokens and authentication state</li>
          <li>User ID (encrypted)</li>
          <li>Login timestamp and session duration</li>
        </ul>
        <p className="mt-3">
          <strong>Privacy Policy:</strong>{' '}
          <a 
            href="https://supabase.com/privacy" 
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://supabase.com/privacy
          </a>
        </p>
      </LegalSection>

      {/* Managing Cookies */}
      <LegalSection
        id="managing-cookies"
        title="4. Managing Your Cookie Preferences"
        summary="You can manage cookies through our consent banner (appears on first visit), your browser settings (block or delete cookies), or by clearing your consent to see the banner again. Disabling essential cookies may limit Service functionality."
      >
        <p>
          You have several options for managing cookies and your privacy:
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">4.1 Cookie Consent Banner</h3>
        <p>
          When you first visit Be Prepared, you will see a cookie consent banner at the bottom of the 
          screen. This banner allows you to:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li><strong>Accept All Cookies:</strong> Allow all cookies including analytics and marketing</li>
          <li><strong>Decline Non-Essential Cookies:</strong> Only allow essential cookies required for core functionality</li>
          <li><strong>Learn More:</strong> Visit this Cookie Policy for detailed information</li>
        </ul>
        <p className="mt-4">
          Your choice is stored in your browser and will be remembered for future visits. You can 
          change your preferences at any time by following the instructions below.
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">4.2 Browser Settings</h3>
        <p>
          Most web browsers allow you to control cookies through their settings. You can:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li><strong>Block all cookies:</strong> Prevent websites from setting any cookies</li>
          <li><strong>Block third-party cookies:</strong> Allow only cookies from the website you&apos;re visiting</li>
          <li><strong>Delete cookies:</strong> Remove all cookies that have been set on your device</li>
          <li><strong>View cookies:</strong> See which cookies are stored and inspect their contents</li>
        </ul>

        <p className="mt-4">
          <strong>How to manage cookies in popular browsers:</strong>
        </p>

        <div className="mt-4 space-y-3">
          <div className="p-3 bg-muted/50 rounded">
            <p className="font-medium">Google Chrome</p>
            <p className="text-sm text-muted-foreground mt-1">
              Settings → Privacy and security → Cookies and other site data
            </p>
          </div>
          <div className="p-3 bg-muted/50 rounded">
            <p className="font-medium">Mozilla Firefox</p>
            <p className="text-sm text-muted-foreground mt-1">
              Settings → Privacy & Security → Cookies and Site Data
            </p>
          </div>
          <div className="p-3 bg-muted/50 rounded">
            <p className="font-medium">Safari</p>
            <p className="text-sm text-muted-foreground mt-1">
              Preferences → Privacy → Manage Website Data
            </p>
          </div>
          <div className="p-3 bg-muted/50 rounded">
            <p className="font-medium">Microsoft Edge</p>
            <p className="text-sm text-muted-foreground mt-1">
              Settings → Privacy, search, and services → Cookies and site permissions
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-r">
          <p className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
            ⚠️ Important Note
          </p>
          <p className="text-yellow-800 dark:text-yellow-200 text-sm leading-relaxed">
            Blocking or deleting cookies may affect your ability to use certain features of the Service. 
            Essential cookies are required for authentication and core functionality. If you block all 
            cookies, you may not be able to log in or save your emergency plans.
          </p>
        </div>

        <h3 className="text-xl font-semibold mt-6 mb-3">4.3 Changing Your Cookie Preferences</h3>
        <p>
          If you want to change your cookie consent preferences after your initial choice:
        </p>
        <ol className="list-decimal pl-6 space-y-2 mt-3">
          <li>Open your browser&apos;s developer console (usually F12 or right-click → Inspect)</li>
          <li>Go to the &quot;Application&quot; or &quot;Storage&quot; tab</li>
          <li>Find &quot;Local Storage&quot; and select our domain</li>
          <li>Delete the &quot;cookie-consent&quot; entry</li>
          <li>Refresh the page - the cookie consent banner will appear again</li>
        </ol>

        <p className="mt-4">
          <strong>Or simply clear all site data:</strong> Use your browser&apos;s settings to clear all 
          cookies and site data for beprepared.ai, then visit our site again to make a new choice.
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">4.4 Do Not Track (DNT)</h3>
        <p>
          Some browsers offer a &quot;Do Not Track&quot; (DNT) signal. Because there is no industry consensus 
          on how to respond to DNT signals, we do not currently respond to DNT browser settings. 
          However, you can use our cookie consent banner to decline non-essential cookies.
        </p>
      </LegalSection>

      {/* Detailed Cookie Information */}
      <LegalSection
        id="cookie-details"
        title="5. Detailed Cookie Information"
        summary="Specific details about the cookies we use, including names, purposes, types, and duration. This technical information helps you understand exactly what data is being stored on your device."
      >
        <p>
          Below is detailed information about the specific cookies used by Be Prepared:
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">5.1 Essential Cookies</h3>
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full border-collapse border border-border">
            <thead>
              <tr className="bg-muted/50">
                <th className="border border-border px-4 py-2 text-left font-semibold">Cookie Name</th>
                <th className="border border-border px-4 py-2 text-left font-semibold">Purpose</th>
                <th className="border border-border px-4 py-2 text-left font-semibold">Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border px-4 py-2 font-mono text-sm">sb-auth-token</td>
                <td className="border border-border px-4 py-2">Maintains your authentication session</td>
                <td className="border border-border px-4 py-2">7 days</td>
              </tr>
              <tr className="bg-muted/20">
                <td className="border border-border px-4 py-2 font-mono text-sm">sb-refresh-token</td>
                <td className="border border-border px-4 py-2">Allows automatic session renewal</td>
                <td className="border border-border px-4 py-2">30 days</td>
              </tr>
              <tr>
                <td className="border border-border px-4 py-2 font-mono text-sm">cookie-consent</td>
                <td className="border border-border px-4 py-2">Stores your cookie preferences</td>
                <td className="border border-border px-4 py-2">1 year</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-xl font-semibold mt-6 mb-3">5.2 Analytics Cookies (Google Analytics)</h3>
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full border-collapse border border-border">
            <thead>
              <tr className="bg-muted/50">
                <th className="border border-border px-4 py-2 text-left font-semibold">Cookie Name</th>
                <th className="border border-border px-4 py-2 text-left font-semibold">Purpose</th>
                <th className="border border-border px-4 py-2 text-left font-semibold">Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border px-4 py-2 font-mono text-sm">_ga</td>
                <td className="border border-border px-4 py-2">Distinguishes unique users</td>
                <td className="border border-border px-4 py-2">2 years</td>
              </tr>
              <tr className="bg-muted/20">
                <td className="border border-border px-4 py-2 font-mono text-sm">_ga_*</td>
                <td className="border border-border px-4 py-2">Used to persist session state</td>
                <td className="border border-border px-4 py-2">2 years</td>
              </tr>
              <tr>
                <td className="border border-border px-4 py-2 font-mono text-sm">_gid</td>
                <td className="border border-border px-4 py-2">Distinguishes users</td>
                <td className="border border-border px-4 py-2">24 hours</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-xl font-semibold mt-6 mb-3">5.3 Payment Cookies (Stripe)</h3>
        <p>
          Stripe uses cookies to enable secure payment processing and fraud detection. These cookies 
          are only active during payment flows (checkout, subscription management).
        </p>
        <p className="mt-3">
          <strong>Duration:</strong> Session cookies (deleted when you close your browser) and 
          short-term cookies (expire within hours or days).
        </p>
        <p className="mt-3">
          For detailed information about Stripe&apos;s cookies, see their{' '}
          <a 
            href="https://stripe.com/cookies-policy/legal" 
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Cookie Policy
          </a>.
        </p>
      </LegalSection>

      {/* Changes */}
      <LegalSection
        id="changes"
        title="6. Changes to This Cookie Policy"
        summary="We may update this Cookie Policy periodically to reflect changes in our cookie usage or legal requirements. We'll notify you of significant changes via email or prominent notice."
      >
        <p>
          We may update this Cookie Policy from time to time to reflect changes in our use of cookies, 
          changes in technology, legal requirements, or other factors. When we make changes, we will 
          update the &quot;Last Updated&quot; date at the top of this Cookie Policy.
        </p>
        <p className="mt-4">
          For material changes, we will provide notice by:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Sending an email to the address associated with your account (if you have one)</li>
          <li>Posting a prominent notice on the Service</li>
          <li>Showing the cookie consent banner again to obtain your updated consent</li>
        </ul>
        <p className="mt-4">
          We recommend reviewing this Cookie Policy periodically to stay informed about our use of cookies.
        </p>
      </LegalSection>

      {/* Contact */}
      <LegalSection
        id="contact"
        title="7. Contact Us"
        summary="For questions about cookies or this policy, contact us at privacy@beprepared.ai. We respond within 30 days."
      >
        <p>
          If you have any questions, concerns, or requests regarding this Cookie Policy or our use 
          of cookies, please contact us:
        </p>
        <div className="mt-6 p-6 bg-muted rounded-lg border">
          <p className="font-semibold text-lg mb-3">6 Foot Media LLC DBA Be Prepared</p>
          <p className="mb-2">
            <strong>Cookie Inquiries:</strong>{' '}
            <a href="mailto:privacy@beprepared.ai" className="text-primary hover:underline">
              privacy@beprepared.ai
            </a>
          </p>
          <p className="mb-2">
            <strong>Cookie Consent Management:</strong> Clear your consent in your browser&apos;s local 
            storage to see the banner again
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            We will respond to your inquiry within 30 days.
          </p>
        </div>

        <div className="mt-6 p-4 bg-primary/10 border-l-4 border-primary rounded-r">
          <p className="font-semibold text-primary mb-2">
            🍪 Summary
          </p>
          <p className="text-foreground/90 text-sm leading-relaxed">
            Be Prepared uses essential cookies for authentication and core functionality (required), 
            and optional analytics cookies to improve our Service (Google Analytics - requires your consent). 
            You can manage your cookie preferences through our consent banner or browser settings. 
            For more information about how we use your data, see our{' '}
            <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </LegalSection>
    </LegalPageLayout>
  );
}

