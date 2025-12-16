import React from 'react';
import { LegalPageLayout } from '@/components/legal/LegalPageLayout';
import { LegalSection } from '@/components/legal/LegalSection';
import { TableOfContents } from '@/components/legal/TableOfContents';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Be Prepared',
  description: 'Privacy Policy for Be Prepared - Learn how we collect, use, and protect your personal information.',
};

export default function PrivacyPolicyPage() {
  const tocItems = [
    { id: 'introduction', title: '1. Introduction' },
    { id: 'data-collection', title: '2. Information We Collect' },
    { id: 'how-we-use', title: '3. How We Use Your Information' },
    { id: 'gdpr-rights', title: '4. Your Privacy Rights (GDPR)' },
    { id: 'cookies', title: '5. Cookies and Tracking' },
    { id: 'data-security', title: '6. Data Security and Retention' },
    { id: 'data-sharing', title: '7. Sharing Your Information' },
    { id: 'childrens-privacy', title: "8. Children's Privacy" },
    { id: 'international-transfers', title: '9. International Data Transfers' },
    { id: 'changes', title: '10. Changes to This Privacy Policy' },
    { id: 'contact', title: '11. Contact Us' },
  ];

  return (
    <LegalPageLayout
      title="Privacy Policy"
      lastUpdated="December 10, 2025"
    >
      <TableOfContents items={tocItems} />

      {/* Introduction */}
      <LegalSection
        id="introduction"
        title="1. Introduction"
        summary="This Privacy Policy explains how 6 Foot Media LLC DBA Be Prepared collects, uses, and protects your personal information. We are committed to transparency and protecting your privacy rights, including GDPR rights for EU users."
      >
        <p>
          Welcome to Be Prepared, operated by 6 Foot Media LLC (&quot;we,&quot; &quot;us,&quot; &quot;our&quot;). 
          We are committed to protecting your personal information and your right to privacy.
        </p>
        <p>
          This Privacy Policy describes how we collect, use, disclose, and safeguard your 
          information when you use our website and application (collectively, the &quot;Service&quot;). 
          Please read this Privacy Policy carefully. If you do not agree with the terms of 
          this Privacy Policy, please do not access the Service.
        </p>
        <p>
          <strong>Contact Information:</strong><br />
          6 Foot Media LLC DBA Be Prepared<br />
          Email: <a href="mailto:privacy@beprepared.ai" className="text-primary hover:underline">privacy@beprepared.ai</a>
        </p>
      </LegalSection>

      {/* Data Collection */}
      <LegalSection
        id="data-collection"
        title="2. Information We Collect"
        summary="We collect information you provide directly (name, email, payment info), automatically through cookies and analytics (Google Analytics), and from third parties (Stripe for payments). We do NOT sell your personal information to third parties."
      >
        <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Information You Provide</h3>
        <p>We collect information that you provide directly to us, including:</p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li><strong>Account Information:</strong> Name, email address, password (encrypted), location (city/region)</li>
          <li><strong>Profile Information:</strong> Emergency preparedness plans, family size, scenarios of interest, existing preparedness level</li>
          <li><strong>Payment Information:</strong> Credit card details processed securely by Stripe (we do not store full card numbers)</li>
          <li><strong>Communication Data:</strong> Messages you send us, support requests, feedback, survey responses</li>
          <li><strong>User-Generated Content:</strong> Plans you create, inventory you track, notes and customizations</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Information Collected Automatically</h3>
        <p>When you access our Service, we automatically collect certain information:</p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li><strong>Usage Data:</strong> Pages viewed, features used, time spent, click patterns, navigation paths</li>
          <li><strong>Device Information:</strong> Browser type, operating system, device identifiers, screen resolution</li>
          <li><strong>Analytics Data:</strong> Collected via Google Analytics to understand user behavior and improve our Service</li>
          <li><strong>Log Data:</strong> IP address, access times, referring URLs, error logs</li>
          <li><strong>Cookies:</strong> See our <a href="/cookies" className="text-primary hover:underline">Cookie Policy</a> for detailed information</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">2.3 Third-Party Services</h3>
        <p>We use the following third-party services that may collect information:</p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li><strong>Supabase:</strong> Authentication services and database hosting for your account and plan data</li>
          <li><strong>Google Analytics:</strong> Website analytics and usage patterns (only if you consent)</li>
          <li><strong>Stripe:</strong> Payment processing and subscription management</li>
          <li><strong>Resend:</strong> Email delivery service for transactional emails (verification, password resets, notifications)</li>
        </ul>
        <p className="mt-3">
          Each of these third-party services has its own privacy policy governing the use of your information. 
          We encourage you to review their privacy policies.
        </p>
      </LegalSection>

      {/* How We Use Information */}
      <LegalSection
        id="how-we-use"
        title="3. How We Use Your Information"
        summary="We use your information to provide the Service (AI plan generation, account management), improve our Service, communicate with you, process payments, and comply with legal obligations. We do NOT use your information for advertising to third parties."
      >
        <p>We use the information we collect for the following purposes:</p>
        
        <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Provide and Maintain the Service</h3>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Generate AI-powered emergency preparedness plans based on your inputs</li>
          <li>Create and manage your account</li>
          <li>Process subscription payments and manage billing</li>
          <li>Store your plans, inventory, and preferences</li>
          <li>Provide customer support and respond to inquiries</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Improve and Optimize the Service</h3>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Analyze usage patterns to understand how users interact with our Service</li>
          <li>Develop new features and improve existing functionality</li>
          <li>Fix bugs and optimize performance</li>
          <li>Conduct research and testing to improve AI-generated content quality</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">3.3 Communication</h3>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Send transactional emails (account verification, password resets, subscription updates)</li>
          <li>Send service announcements and important updates</li>
          <li>Send newsletters and educational content (with your consent, you can opt out anytime)</li>
          <li>Respond to your comments, questions, and support requests</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">3.4 Legal and Security</h3>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Comply with legal obligations and respond to legal requests</li>
          <li>Enforce our Terms of Service and other agreements</li>
          <li>Protect against fraud, unauthorized access, and security threats</li>
          <li>Protect the rights, property, and safety of Be Prepared, our users, and the public</li>
        </ul>

        <p className="mt-6 p-4 bg-primary/10 border-l-4 border-primary rounded-r">
          <strong>Important:</strong> We do NOT sell your personal information to third parties. 
          We do NOT use your information for advertising purposes beyond our own Service.
        </p>
      </LegalSection>

      {/* GDPR Rights */}
      <LegalSection
        id="gdpr-rights"
        title="4. Your Privacy Rights (GDPR)"
        summary="EU users have specific rights under GDPR: access your data, correct errors, request deletion, export your data, restrict processing, object to processing, and withdraw consent. Submit requests through our in-app form or email privacy@beprepared.ai. We respond within 30 days."
      >
        <p>
          If you are a resident of the European Economic Area (EEA), you have certain 
          data protection rights under the General Data Protection Regulation (GDPR):
        </p>
        
        <h3 className="text-xl font-semibold mt-6 mb-3">Your Rights Include:</h3>
        <ul className="list-disc pl-6 space-y-3 mt-3">
          <li>
            <strong>Right to Access:</strong> You can request a copy of the personal data we hold about you
          </li>
          <li>
            <strong>Right to Rectification:</strong> You can correct inaccurate or incomplete personal data
          </li>
          <li>
            <strong>Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> You can request deletion of your personal data
          </li>
          <li>
            <strong>Right to Data Portability:</strong> You can receive your personal data in a structured, 
            machine-readable format and transfer it to another service
          </li>
          <li>
            <strong>Right to Restrict Processing:</strong> You can request that we limit how we use your data
          </li>
          <li>
            <strong>Right to Object:</strong> You can object to our processing of your personal data for certain purposes
          </li>
          <li>
            <strong>Right to Withdraw Consent:</strong> Where processing is based on consent, 
            you can withdraw consent at any time without affecting the lawfulness of processing before withdrawal
          </li>
          <li>
            <strong>Right to Lodge a Complaint:</strong> You can file a complaint with your local data protection authority
          </li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">How to Exercise Your Rights:</h3>
        <p>
          To exercise any of these rights, please submit a request through our in-app data 
          request form (available in your account settings under &quot;Privacy &amp; Data&quot;) or contact us at{' '}
          <a href="mailto:privacy@beprepared.ai" className="text-primary hover:underline">
            privacy@beprepared.ai
          </a>
          . We will respond to your request within 30 days.
        </p>
        
        <p className="mt-4">
          <strong>Identity Verification:</strong> To protect your privacy, we may require identity 
          verification before fulfilling data requests. We may ask for additional information to 
          confirm your identity.
        </p>

        <p className="mt-4">
          <strong>Limitations:</strong> Some requests may be limited by legal obligations. For example, 
          we may retain certain information as required by law or for legitimate business purposes 
          (such as completing transactions or resolving disputes).
        </p>
      </LegalSection>

      {/* Cookie Usage */}
      <LegalSection
        id="cookies"
        title="5. Cookies and Tracking"
        summary="We use essential cookies (authentication, session management) and optional analytics cookies (Google Analytics). You can manage cookie preferences through our cookie consent banner. See our Cookie Policy for full details."
      >
        <p>
          We use cookies and similar tracking technologies to collect and store information. 
          For detailed information about the cookies we use and your choices, please see our{' '}
          <a href="/cookies" className="text-primary hover:underline">Cookie Policy</a>.
        </p>
        
        <h3 className="text-xl font-semibold mt-6 mb-3">Types of Cookies:</h3>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li><strong>Essential Cookies:</strong> Required for authentication and core functionality (cannot be disabled without affecting Service functionality)</li>
          <li><strong>Analytics Cookies:</strong> Help us understand how users interact with our Service (Google Analytics - requires consent)</li>
          <li><strong>Marketing Cookies:</strong> May be used for targeted content in the future (optional, requires explicit consent)</li>
        </ul>
        
        <h3 className="text-xl font-semibold mt-6 mb-3">Managing Cookies:</h3>
        <p>You can manage your cookie preferences through:</p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li><strong>Cookie Consent Banner:</strong> Accept or decline non-essential cookies when you first visit our Service</li>
          <li><strong>Browser Settings:</strong> Most browsers allow you to refuse or delete cookies</li>
          <li><strong>Cookie Policy Page:</strong> Visit our <a href="/cookies" className="text-primary hover:underline">Cookie Policy</a> for instructions on clearing consent and updating preferences</li>
        </ul>
        
        <p className="mt-4">
          <strong>Note:</strong> Disabling certain cookies may limit some features of the Service.
        </p>
      </LegalSection>

      {/* Data Security */}
      <LegalSection
        id="data-security"
        title="6. Data Security and Retention"
        summary="We use industry-standard security measures (encryption, secure servers, access controls) to protect your data. We retain data as long as your account is active or as needed for legal obligations. We cannot guarantee absolute security but continuously work to improve protection."
      >
        <h3 className="text-xl font-semibold mt-6 mb-3">Security Measures:</h3>
        <p>We implement appropriate technical and organizational measures to protect your personal data:</p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li><strong>Encryption:</strong> Data encrypted in transit (HTTPS/TLS) and at rest in databases</li>
          <li><strong>Secure Authentication:</strong> Industry-standard authentication via Supabase Auth</li>
          <li><strong>Access Controls:</strong> Strict access controls limiting who can access user data</li>
          <li><strong>Regular Security Audits:</strong> Ongoing security assessments and updates</li>
          <li><strong>PCI-DSS Compliance:</strong> Payment data processed by PCI-DSS compliant providers (Stripe)</li>
          <li><strong>Secure Infrastructure:</strong> Hosted on secure, SOC 2 compliant infrastructure</li>
        </ul>
        
        <h3 className="text-xl font-semibold mt-6 mb-3">Data Retention:</h3>
        <p>We retain your personal data for as long as:</p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Your account is active</li>
          <li>Needed to provide the Service to you</li>
          <li>Required by law or for legitimate business purposes</li>
          <li>Necessary to resolve disputes, enforce agreements, or protect legal rights</li>
        </ul>
        
        <p className="mt-4">
          <strong>Account Deletion:</strong> When you delete your account, we will delete or anonymize 
          your personal data within 30 days, except where retention is required by law or for legitimate 
          business purposes (such as fraud prevention or financial record-keeping).
        </p>
        
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-r">
          <p className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
            ⚠️ Security Disclaimer
          </p>
          <p className="text-yellow-800 dark:text-yellow-200 text-sm leading-relaxed">
            While we strive to protect your personal data using industry-standard security measures, 
            no method of transmission over the internet or electronic storage is 100% secure. 
            We cannot guarantee absolute security. You use the Service at your own risk.
          </p>
        </div>
      </LegalSection>

      {/* Data Sharing */}
      <LegalSection
        id="data-sharing"
        title="7. Sharing Your Information"
        summary="We share your information only with trusted service providers (Supabase, Google Analytics, Stripe, Resend) necessary to operate the Service, when required by law, or with your explicit consent. We do NOT sell your data to third parties."
      >
        <p>We share your personal information only in the following circumstances:</p>
        
        <h3 className="text-xl font-semibold mt-6 mb-3">7.1 Service Providers</h3>
        <p>We share information with third-party service providers who perform services on our behalf:</p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li><strong>Supabase:</strong> Database hosting and authentication services</li>
          <li><strong>Stripe:</strong> Payment processing and subscription billing</li>
          <li><strong>Google Analytics:</strong> Website analytics (only if you consent)</li>
          <li><strong>Resend:</strong> Email delivery services</li>
        </ul>
        <p className="mt-3">
          These service providers are contractually obligated to protect your information and 
          use it only for the purposes we specify.
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">7.2 Legal Requirements</h3>
        <p>We may disclose your information if required to do so by law or in response to:</p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Valid legal requests (subpoenas, court orders, government inquiries)</li>
          <li>Enforcement of our Terms of Service or other agreements</li>
          <li>Protection of the rights, property, or safety of Be Prepared, our users, or the public</li>
          <li>Investigation of fraud, security issues, or other illegal activities</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">7.3 Business Transfers</h3>
        <p>
          If Be Prepared is involved in a merger, acquisition, or sale of assets, your information 
          may be transferred as part of that transaction. We will notify you via email and/or a 
          prominent notice on our Service before your information is transferred and becomes subject 
          to a different privacy policy.
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">7.4 With Your Consent</h3>
        <p>
          We may share your information for other purposes with your explicit consent or at your direction.
        </p>

        <div className="mt-6 p-4 bg-primary/10 border-l-4 border-primary rounded-r">
          <p className="font-semibold text-primary mb-2">
            🔒 We Do NOT Sell Your Data
          </p>
          <p className="text-foreground/90 text-sm leading-relaxed">
            We do not sell, rent, or trade your personal information to third parties for their 
            marketing purposes. Your data is used solely to provide and improve our Service.
          </p>
        </div>
      </LegalSection>

      {/* Children's Privacy */}
      <LegalSection
        id="childrens-privacy"
        title="8. Children's Privacy"
        summary="Our Service is not intended for users under 18. We do not knowingly collect information from children. If we discover we have collected data from a child, we will delete it immediately."
      >
        <p>
          Our Service is not intended for individuals under the age of 18. We do not knowingly 
          collect personal information from children under 18. Our Terms of Service require users 
          to be at least 18 years old to create an account.
        </p>
        <p className="mt-4">
          If you are a parent or guardian and believe your child has provided us with personal 
          information without your consent, please contact us immediately at{' '}
          <a href="mailto:privacy@beprepared.ai" className="text-primary hover:underline">
            privacy@beprepared.ai
          </a>
          . We will delete such information from our systems promptly.
        </p>
        <p className="mt-4">
          If we become aware that we have collected personal information from a child under 18 
          without verification of parental consent, we will take steps to delete that information 
          as quickly as possible.
        </p>
      </LegalSection>

      {/* International Transfers */}
      <LegalSection
        id="international-transfers"
        title="9. International Data Transfers"
        summary="We are based in the United States. By using our Service, you consent to your data being transferred to and processed in the U.S. We take steps to ensure adequate protection for international transfers."
      >
        <p>
          We are based in New Jersey, United States. Your information may be transferred to 
          and maintained on servers located in the United States or other countries where 
          our service providers operate.
        </p>
        <p className="mt-4">
          If you are accessing the Service from outside the United States, please be aware 
          that your information may be transferred to, stored, and processed in the United States 
          and other countries, where data protection laws may differ from those in your country 
          of residence.
        </p>
        <p className="mt-4">
          By using the Service, you consent to the transfer of your information to the United 
          States and other countries. We take steps to ensure that your data receives adequate 
          protection in accordance with applicable data protection laws, including:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Using service providers that comply with international data protection standards</li>
          <li>Implementing appropriate safeguards for international data transfers</li>
          <li>Ensuring contractual protections for data transferred to third parties</li>
        </ul>
      </LegalSection>

      {/* Changes to Policy */}
      <LegalSection
        id="changes"
        title="10. Changes to This Privacy Policy"
        summary="We may update this Privacy Policy periodically. We will notify you of significant changes via email or prominent notice on our Service. Continued use after changes indicates acceptance."
      >
        <p>
          We may update this Privacy Policy from time to time to reflect changes in our practices, 
          technology, legal requirements, or other factors. When we make changes, we will update 
          the &quot;Last Updated&quot; date at the top of this Privacy Policy.
        </p>
        <p className="mt-4">
          We will notify you of any material changes by:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Sending an email to the address associated with your account</li>
          <li>Posting a prominent notice on our Service</li>
          <li>Requiring you to accept the updated Privacy Policy before continuing to use the Service (for significant changes)</li>
        </ul>
        <p className="mt-4">
          Your continued use of the Service after the effective date of any changes constitutes 
          your acceptance of the updated Privacy Policy. If you do not agree to the updated 
          Privacy Policy, you should stop using the Service and may delete your account.
        </p>
      </LegalSection>

      {/* Contact */}
      <LegalSection
        id="contact"
        title="11. Contact Us"
        summary="For privacy questions or to exercise your rights, contact us at privacy@beprepared.ai or through our in-app data request form. We respond within 30 days."
      >
        <p>
          If you have any questions, concerns, or requests regarding this Privacy Policy or 
          our data practices, please contact us:
        </p>
        <div className="mt-6 p-6 bg-muted rounded-lg border">
          <p className="font-semibold text-lg mb-3">6 Foot Media LLC DBA Be Prepared</p>
          <p className="mb-2">
            <strong>Privacy Inquiries:</strong>{' '}
            <a href="mailto:privacy@beprepared.ai" className="text-primary hover:underline">
              privacy@beprepared.ai
            </a>
          </p>
          <p className="mb-2">
            <strong>In-App Data Requests:</strong> Available in your account settings under &quot;Privacy &amp; Data&quot;
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            We will respond to your inquiry within 30 days. For GDPR requests, we will respond 
            within 30 days as required by law.
          </p>
        </div>
      </LegalSection>
    </LegalPageLayout>
  );
}


