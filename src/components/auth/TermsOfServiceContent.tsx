export function TermsOfServiceContent() {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          1. Acceptance of Terms
        </h3>
        <p>
          By accessing and using Emergency Planner (&ldquo;the Service&rdquo;), you accept and agree to be bound by
          the terms and provision of this agreement. If you do not agree to abide by the above, please do not use
          this service.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          2. Use License
        </h3>
        <p className="mb-2">
          Permission is granted to temporarily use the Service for personal, non-commercial purposes. This is the
          grant of a license, not a transfer of title, and under this license you may not:
        </p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>modify or copy the materials;</li>
          <li>use the materials for any commercial purpose or for any public display;</li>
          <li>attempt to reverse engineer any software contained in the Service;</li>
          <li>remove any copyright or other proprietary notations from the materials; or</li>
          <li>
            transfer the materials to another person or &ldquo;mirror&rdquo; the materials on any other server.
          </li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          3. User Account
        </h3>
        <p className="mb-2">
          When you create an account with us, you must provide information that is accurate, complete, and current
          at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate
          termination of your account.
        </p>
        <p>
          You are responsible for safeguarding the password that you use to access the Service and for any
          activities or actions under your password. You agree not to disclose your password to any third party.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          4. User Content
        </h3>
        <p className="mb-2">
          Our Service allows you to create, store, and manage emergency plans and related information. You retain
          all rights to your content. By using our Service, you grant us the right to store, process, and display
          your content solely for the purpose of providing the Service to you.
        </p>
        <p>
          You are responsible for the content you create and share. You agree not to use the Service to create,
          store, or share content that is illegal, harmful, threatening, abusive, harassing, defamatory, or
          otherwise objectionable.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          5. Emergency Information Disclaimer
        </h3>
        <p className="mb-2">
          Emergency Planner is a planning and organizational tool designed to help you prepare for emergencies. It
          is not a substitute for professional emergency services, medical advice, or official emergency response
          systems.
        </p>
        <p>
          In case of actual emergencies, always contact your local emergency services (911 in the US, or your
          local equivalent) immediately. Do not rely solely on information stored in this Service during an active
          emergency.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          6. Service Availability
        </h3>
        <p>
          We strive to provide reliable service, but we do not guarantee that the Service will be available at all
          times or that it will be error-free. We may modify, suspend, or discontinue the Service at any time
          without prior notice.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          7. Limitation of Liability
        </h3>
        <p>
          In no event shall Emergency Planner or its suppliers be liable for any damages (including, without
          limitation, damages for loss of data or profit, or due to business interruption) arising out of the use
          or inability to use the Service, even if Emergency Planner or an authorized representative has been
          notified orally or in writing of the possibility of such damage.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          8. Privacy
        </h3>
        <p>
          Your use of the Service is also governed by our Privacy Policy. Please review our Privacy Policy, which
          explains how we collect, use, and protect your personal information.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          9. Payment and Subscription
        </h3>
        <p className="mb-2">
          Some features of the Service may require payment. If you choose to use paid features:
        </p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>You agree to pay all fees associated with your subscription plan</li>
          <li>Subscriptions automatically renew unless cancelled before the renewal date</li>
          <li>Refunds are provided in accordance with our refund policy</li>
          <li>We reserve the right to change pricing with reasonable advance notice</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          10. Termination
        </h3>
        <p>
          We may terminate or suspend your account and bar access to the Service immediately, without prior notice
          or liability, under our sole discretion, for any reason whatsoever, including without limitation if you
          breach the Terms. Upon termination, your right to use the Service will immediately cease.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          11. Changes to Terms
        </h3>
        <p>
          We reserve the right to modify or replace these Terms at any time. If a revision is material, we will
          provide at least 30 days&rsquo; notice prior to any new terms taking effect. What constitutes a material
          change will be determined at our sole discretion.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          12. Governing Law
        </h3>
        <p>
          These Terms shall be governed and construed in accordance with the laws of the United States, without
          regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms
          will not be considered a waiver of those rights.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          13. Contact Information
        </h3>
        <p>
          If you have any questions about these Terms, please contact us at:
          <br />
          <span className="font-medium">support@emergencyplanner.com</span>
        </p>
      </section>

      <section className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </section>
    </div>
  );
}














