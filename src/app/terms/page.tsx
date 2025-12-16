import React from 'react';
import { LegalPageLayout } from '@/components/legal/LegalPageLayout';
import { LegalSection } from '@/components/legal/LegalSection';
import { TableOfContents } from '@/components/legal/TableOfContents';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Be Prepared',
  description: 'Terms of Service for Be Prepared - Read our terms and conditions for using our emergency preparedness platform.',
};

export default function TermsOfServicePage() {
  const tocItems = [
    { id: 'acceptance', title: '1. Acceptance of Terms' },
    { id: 'eligibility', title: '2. Eligibility and Account Registration' },
    { id: 'subscription', title: '3. Subscription Plans and Billing' },
    { id: 'disclaimers', title: '4. Disclaimers and Limitation of Liability' },
    { id: 'acceptable-use', title: '5. Acceptable Use Policy' },
    { id: 'affiliate', title: '6. Affiliate Disclosure' },
    { id: 'intellectual-property', title: '7. Intellectual Property Rights' },
    { id: 'user-content', title: '8. User-Generated Content' },
    { id: 'dispute-resolution', title: '9. Dispute Resolution and Arbitration' },
    { id: 'termination', title: '10. Termination and Suspension' },
    { id: 'changes', title: '11. Changes to Terms' },
    { id: 'contact', title: '12. Contact Information' },
  ];

  return (
    <LegalPageLayout
      title="Terms of Service"
      lastUpdated="December 10, 2025"
    >
      <TableOfContents items={tocItems} />

      {/* Acceptance of Terms */}
      <LegalSection
        id="acceptance"
        title="1. Acceptance of Terms"
        summary="By accessing or using Be Prepared, you agree to these Terms of Service and our Privacy Policy. If you don't agree, you must not use our Service. These terms are legally binding."
      >
        <p>
          Welcome to Be Prepared, operated by 6 Foot Media LLC (&quot;we,&quot; &quot;us,&quot; &quot;our,&quot; &quot;Company&quot;). 
          By accessing or using our website, application, or services (collectively, the &quot;Service&quot;), 
          you agree to be bound by these Terms of Service (&quot;Terms&quot;) and our Privacy Policy.
        </p>
        <p>
          <strong>IF YOU DO NOT AGREE TO THESE TERMS, YOU MUST NOT ACCESS OR USE THE SERVICE.</strong>
        </p>
        <p>
          These Terms constitute a legally binding agreement between you and 6 Foot Media LLC DBA Be Prepared. 
          By creating an account, accessing content, or using any features of the Service, you acknowledge 
          that you have read, understood, and agree to be bound by these Terms.
        </p>
      </LegalSection>

      {/* Eligibility */}
      <LegalSection
        id="eligibility"
        title="2. Eligibility and Account Registration"
        summary="You must be 18 years or older to use Be Prepared. You're responsible for maintaining account security and the accuracy of your information. One account per person."
      >
        <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Age Requirement</h3>
        <p>
          You must be at least 18 years old to create an account and use the Service. By creating an account, 
          you represent and warrant that you are at least 18 years of age. We do not knowingly collect 
          information from or provide services to individuals under the age of 18.
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Account Registration</h3>
        <p>To access certain features of the Service, you must create an account by providing:</p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>A valid email address</li>
          <li>A secure password</li>
          <li>Accurate personal information as requested</li>
        </ul>
        <p className="mt-3">
          You agree to provide accurate, current, and complete information during registration and to 
          update your information to maintain its accuracy.
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">2.3 Account Security</h3>
        <p>
          You are responsible for maintaining the confidentiality of your account credentials and for 
          all activities that occur under your account. You agree to:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Use a strong, unique password for your account</li>
          <li>Not share your password with others</li>
          <li>Notify us immediately of any unauthorized use of your account</li>
          <li>Log out of your account at the end of each session</li>
        </ul>
        <p className="mt-3">
          <strong>You are solely responsible for any activities or actions taken under your account,</strong> 
          whether or not you authorized such activities.
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">2.4 One Account Per User</h3>
        <p>
          You may only create one account. Creating multiple accounts to circumvent subscription limits 
          or other restrictions is prohibited and may result in termination of all your accounts.
        </p>
      </LegalSection>

      {/* Subscription Plans and Billing */}
      <LegalSection
        id="subscription"
        title="3. Subscription Plans and Billing"
        summary="Be Prepared offers Free, Basic ($9.99/mo), and Pro ($49.99/mo) plans. Subscriptions auto-renew unless canceled. No refunds after 7 days. When you cancel, you keep access until the end of your billing period."
      >
        <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Subscription Tiers</h3>
        <p>Be Prepared offers the following subscription tiers:</p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li><strong>Free Tier:</strong> $0 - Limited to 1 saved plan with basic features</li>
          <li><strong>Basic Tier:</strong> $9.99/month or $99/year - Unlimited plans, plan sharing, and founder group calls</li>
          <li><strong>Pro Tier:</strong> $49.99/month or $499/year - All Basic features plus quarterly 1-on-1 expert calls, custom routes, and priority support</li>
        </ul>
        <p className="mt-3">
          Features, limitations, and pricing for each tier are subject to change. We will notify you 
          of any changes that affect your subscription.
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Billing and Payment</h3>
        <p>
          When you subscribe to a paid tier (Basic or Pro), you authorize us to charge your payment 
          method on file for the subscription fee. Payments are processed securely by Stripe, our 
          third-party payment processor.
        </p>
        <p className="mt-3">
          <strong>Payment Methods:</strong> We accept major credit cards and debit cards. You agree to 
          provide current, complete, and accurate payment information. You must promptly update your 
          payment information if it changes or expires.
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">3.3 Automatic Renewal</h3>
        <p>
          <strong>Your subscription will automatically renew at the end of each billing period</strong> 
          (monthly or annually, depending on your plan) unless you cancel before the renewal date.
        </p>
        <p className="mt-3">
          You will be charged the then-current subscription fee for your tier. We will notify you in 
          advance of any price changes. By continuing your subscription after a price increase, you 
          agree to pay the new price.
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">3.4 Refund Policy</h3>
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-r mt-3">
          <p className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
            ⚠️ Important Refund Terms
          </p>
          <p className="text-yellow-800 dark:text-yellow-200 text-sm leading-relaxed">
            <strong>No refunds will be provided after 7 days from the date of purchase or renewal.</strong> 
            If you are unsatisfied with the Service, you may request a refund within 7 days of your 
            initial purchase or renewal by contacting us at privacy@beprepared.ai.
          </p>
        </div>
        <p className="mt-4">
          Refund requests must be submitted within 7 days and will be processed within 10 business days. 
          Refunds are issued to the original payment method. We reserve the right to deny refund requests 
          that we believe are fraudulent or abusive.
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">3.5 Cancellation Policy</h3>
        <p>
          You may cancel your subscription at any time through your account settings or by contacting 
          us at privacy@beprepared.ai.
        </p>
        <p className="mt-3">
          <strong>When you cancel:</strong>
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Your subscription will not renew at the end of the current billing period</li>
          <li><strong>You will retain access to paid features until the end of your current billing period</strong></li>
          <li>After the billing period ends, your account will be downgraded to the Free tier</li>
          <li>No prorated refunds will be issued for partial billing periods (except within the 7-day refund window)</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">3.6 Upgrades and Downgrades</h3>
        <p>
          You may upgrade or downgrade your subscription tier at any time:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li><strong>Upgrades:</strong> Take effect immediately. You will be charged a prorated amount for the remainder of your billing period.</li>
          <li><strong>Downgrades:</strong> Take effect at the end of your current billing period. You retain access to your current tier features until then.</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">3.7 Failed Payments</h3>
        <p>
          If a payment fails, we will attempt to charge your payment method again. If payment continues 
          to fail, your account may be suspended or downgraded to the Free tier after a grace period. 
          You remain responsible for any outstanding charges.
        </p>
      </LegalSection>

      {/* LIABILITY DISCLAIMERS - MOST CRITICAL SECTION */}
      <LegalSection
        id="disclaimers"
        title="4. Disclaimers and Limitation of Liability"
        summary="CRITICAL: Be Prepared provides AI-generated emergency preparedness advice for informational purposes ONLY. This is NOT professional advice. You use our Service at your own risk. We are NOT liable for injury, death, or property loss resulting from following our recommendations. Always consult professionals and official sources."
      >
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-lg mb-6">
          <p className="font-bold text-lg text-red-900 dark:text-red-100 mb-3">
            ⚠️ CRITICAL SAFETY NOTICE
          </p>
          <p className="text-red-800 dark:text-red-200 leading-relaxed">
            The information and recommendations provided by Be Prepared are generated by 
            artificial intelligence and are for <strong>informational and educational purposes only</strong>. 
            Emergency preparedness and disaster response involve serious risks to life and property. 
            <strong> You must not rely solely on Be Prepared for life-safety decisions.</strong>
          </p>
        </div>

        <h3 className="text-xl font-semibold mt-8 mb-4">4.1 AI-Generated Content Disclaimer</h3>
        <p>
          <strong>The information, plans, recommendations, and advice provided by Be Prepared are 
          generated by artificial intelligence and are for informational and educational purposes only.</strong> 
          This content does not constitute:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Professional emergency management advice</li>
          <li>Disaster preparedness consulting services</li>
          <li>Expert guidance from certified emergency professionals</li>
          <li>Medical, legal, or financial advice</li>
          <li>Official government emergency instructions</li>
          <li>Recommendations from licensed professionals in any field</li>
          <li>Substitute for professional consultation or expert assessment</li>
        </ul>
        
        <p className="mt-4 font-semibold text-lg">
          You should not rely solely on AI-generated content for life-safety decisions.
        </p>

        <h3 className="text-xl font-semibold mt-8 mb-4">4.2 Not a Substitute for Professional Services</h3>
        <p>
          <strong>Be Prepared is not a substitute for professional emergency management services, 
          government emergency preparedness programs, or expert consultation.</strong> Always follow 
          official guidance from:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li><strong>FEMA (Federal Emergency Management Agency)</strong> and local emergency management agencies</li>
          <li><strong>National Weather Service</strong> for weather-related emergencies</li>
          <li><strong>Local law enforcement and first responders</strong> for immediate threats</li>
          <li><strong>Public health authorities (CDC, WHO, local health departments)</strong> for pandemic and health emergencies</li>
          <li><strong>Certified emergency preparedness professionals</strong> for personalized planning</li>
          <li><strong>Licensed medical professionals</strong> for health-related preparedness decisions</li>
          <li><strong>Licensed contractors and engineers</strong> for structural safety and home modifications</li>
        </ul>

        <p className="mt-4 font-semibold">
          When in doubt, <strong>always prioritize official emergency instructions and professional guidance</strong> 
          over recommendations from Be Prepared.
        </p>

        <h3 className="text-xl font-semibold mt-8 mb-4">4.3 No Guarantee of Accuracy or Completeness</h3>
        <p>
          While we strive to provide accurate and helpful information, <strong>we make no warranties 
          or guarantees regarding the accuracy, completeness, reliability, currentness, or suitability 
          of any content provided by Be Prepared.</strong>
        </p>
        <p className="mt-3">
          AI-generated content may contain:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Errors, inaccuracies, or omissions</li>
          <li>Outdated information that does not reflect current best practices</li>
          <li>Recommendations that may not be suitable for your specific circumstances</li>
          <li>Incomplete guidance that does not account for all relevant factors</li>
          <li>Content that may conflict with official emergency management guidelines</li>
        </ul>
        <p className="mt-4">
          Emergency situations are complex, dynamic, and unpredictable. No automated system or AI can 
          account for all variables, assess all risks, or guarantee successful outcomes. You must use 
          your own judgment and consult multiple authoritative sources before making preparedness decisions.
        </p>

        <h3 className="text-xl font-semibold mt-8 mb-4">4.4 Assumption of Risk</h3>
        <p>
          <strong>YOU ACKNOWLEDGE AND AGREE THAT YOU USE BE PREPARED AND FOLLOW ANY RECOMMENDATIONS 
          AT YOUR OWN RISK.</strong> Emergency preparedness, disaster response, and survival situations 
          involve inherent and significant risks, including but not limited to:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li><strong>Personal injury, bodily harm, or death</strong></li>
          <li><strong>Property damage, destruction, or loss</strong></li>
          <li><strong>Financial loss or economic damages</strong></li>
          <li><strong>Emotional distress or psychological harm</strong></li>
          <li><strong>Reliance on inaccurate, incomplete, or unsuitable information</strong></li>
          <li><strong>Failure of recommended strategies, equipment, or supplies</strong></li>
          <li><strong>Unforeseen circumstances, complications, or emergencies</strong></li>
          <li><strong>Harm resulting from inadequate preparation or response</strong></li>
        </ul>

        <p className="mt-4 font-semibold text-lg">
          YOU ASSUME ALL RISKS ASSOCIATED WITH IMPLEMENTING ANY PLANS, STRATEGIES, OR 
          RECOMMENDATIONS PROVIDED BY BE PREPARED.
        </p>

        <p className="mt-4">
          We cannot and do not guarantee that following our recommendations will prevent injury, death, 
          or property loss in an emergency. Your safety and survival depend on numerous factors beyond 
          our control, including but not limited to the severity of the emergency, your physical condition, 
          available resources, timing of your response, and many other variables.
        </p>

        <h3 className="text-xl font-semibold mt-8 mb-4">4.5 Consult Multiple Sources</h3>
        <p>
          <strong>WE STRONGLY RECOMMEND AND REQUIRE THAT YOU CONSULT MULTIPLE SOURCES OF INFORMATION</strong> 
          before making any decisions about disaster preparedness or emergency response, including:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Government emergency preparedness websites (Ready.gov, FEMA.gov, CDC.gov)</li>
          <li>Local emergency management agencies and county/state emergency services</li>
          <li>Certified emergency preparedness professionals and consultants</li>
          <li>Books and authoritative publications on emergency preparedness and survival</li>
          <li>Community emergency response teams (CERT programs) and local training</li>
          <li>Medical professionals for health-related preparedness questions</li>
          <li>Licensed contractors for home safety and structural modifications</li>
          <li>Law enforcement for security-related preparedness</li>
        </ul>

        <p className="mt-4 font-semibold text-lg">
          DO NOT RELY EXCLUSIVELY ON BE PREPARED FOR LIFE-SAFETY DECISIONS.
        </p>

        <p className="mt-3">
          Cross-reference our recommendations with other trusted sources. Adapt all recommendations 
          to your specific circumstances, location, resources, and abilities. Seek professional guidance 
          for critical decisions that could impact your safety, health, or survival.
        </p>

        <h3 className="text-xl font-semibold mt-8 mb-4">4.6 LIMITATION OF LIABILITY</h3>
        <div className="p-6 bg-gray-100 dark:bg-gray-800 border-2 border-gray-400 rounded-lg mt-4">
          <p className="font-bold uppercase mb-4 text-lg">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW:
          </p>
          <p className="leading-relaxed mb-4">
            <strong>6 FOOT MEDIA LLC DBA BE PREPARED, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, 
            CONTRACTORS, AFFILIATES, SUBSIDIARIES, SUCCESSORS, AND ASSIGNS (COLLECTIVELY, &quot;THE COMPANY&quot;) 
            SHALL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, 
            OR PUNITIVE DAMAGES OF ANY KIND, INCLUDING BUT NOT LIMITED TO:</strong>
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>PERSONAL INJURY, DEATH, OR BODILY HARM OF ANY KIND</strong></li>
            <li><strong>PROPERTY DAMAGE, DESTRUCTION, OR LOSS</strong></li>
            <li><strong>FINANCIAL LOSS OR ECONOMIC DAMAGES</strong></li>
            <li><strong>EMOTIONAL DISTRESS, MENTAL ANGUISH, OR PSYCHOLOGICAL HARM</strong></li>
            <li><strong>LOSS OF DATA, PROFITS, OR BUSINESS INTERRUPTION</strong></li>
            <li><strong>FAILURE TO PREPARE FOR OR RESPOND TO EMERGENCIES</strong></li>
            <li><strong>INADEQUATE EMERGENCY RESPONSE OR SURVIVAL PREPARATION</strong></li>
            <li><strong>RELIANCE ON INACCURATE, INCOMPLETE, OR UNSUITABLE INFORMATION</strong></li>
            <li><strong>FAILURE OF RECOMMENDED EQUIPMENT, SUPPLIES, OR STRATEGIES</strong></li>
            <li><strong>CONSEQUENCES OF EVACUATION OR SHELTER-IN-PLACE DECISIONS</strong></li>
            <li><strong>INJURIES OR HARM DURING EMERGENCY SITUATIONS</strong></li>
            <li><strong>LOSS OF LIFE OR WRONGFUL DEATH</strong></li>
          </ul>
          <p className="mt-4 leading-relaxed">
            ARISING OUT OF OR RELATED TO YOUR USE OF BE PREPARED, YOUR RELIANCE ON ANY CONTENT 
            PROVIDED BY THE SERVICE, YOUR IMPLEMENTATION OF ANY RECOMMENDATIONS OR STRATEGIES 
            SUGGESTED BY THE SERVICE, YOUR FAILURE TO ADEQUATELY PREPARE FOR EMERGENCIES, OR 
            ANY OTHER MATTER RELATING TO THE SERVICE, <strong>EVEN IF THE COMPANY HAS BEEN ADVISED 
            OF THE POSSIBILITY OF SUCH DAMAGES.</strong>
          </p>
        </div>

        <h3 className="text-xl font-semibold mt-8 mb-4">4.7 Maximum Aggregate Liability</h3>
        <p>
          In jurisdictions where limitation of liability is not permitted for certain types of damages, 
          our liability shall be limited to the maximum extent permitted by law.
        </p>
        <p className="mt-3">
          <strong>In no event shall the Company&apos;s total aggregate liability for all claims arising 
          out of or relating to the Service exceed the greater of:</strong>
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>The amount you paid to Be Prepared in the twelve (12) months preceding the claim, or</li>
          <li>$100 USD</li>
        </ul>
        <p className="mt-3">
          This limitation applies regardless of the legal theory on which the claim is based, including 
          breach of contract, breach of warranty, tort (including negligence), product liability, strict 
          liability, or any other basis.
        </p>

        <h3 className="text-xl font-semibold mt-8 mb-4">4.8 No Warranty of Service Availability</h3>
        <p>
          <strong>THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND,</strong> 
          either express or implied, including but not limited to:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Warranties of merchantability</li>
          <li>Warranties of fitness for a particular purpose</li>
          <li>Warranties of non-infringement</li>
          <li>Warranties of title</li>
          <li>Warranties arising from course of dealing or usage of trade</li>
        </ul>
        <p className="mt-4">
          <strong>We do not warrant that:</strong>
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>The Service will be available, accessible, uninterrupted, timely, secure, or error-free</li>
          <li>The Service will function without failures, delays, or technical problems</li>
          <li>Content generated by AI will be accurate, complete, current, or suitable for your needs</li>
          <li>Results obtained from the Service will meet your expectations or requirements</li>
          <li>Errors or defects in the Service will be corrected</li>
          <li>The Service will be free from viruses or other harmful components</li>
          <li>Any recommendations or information provided will prevent harm or ensure safety</li>
        </ul>

        <h3 className="text-xl font-semibold mt-8 mb-4">4.9 Third-Party Content and Links</h3>
        <p>
          The Service may contain links to third-party websites, products, or services (including 
          affiliate links to Amazon and other retailers). We do not endorse, warrant, or assume 
          responsibility for any third-party content, products, or services.
        </p>
        <p className="mt-3">
          <strong>You access third-party websites and purchase third-party products at your own risk.</strong> 
          We are not responsible for the quality, safety, legality, or suitability of any products 
          purchased through our affiliate links or recommendations.
        </p>

        <h3 className="text-xl font-semibold mt-8 mb-4">4.10 Emergency Situations - Official Instructions Take Precedence</h3>
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-lg mt-4">
          <p className="font-bold text-red-900 dark:text-red-100 mb-3">
            🚨 IN AN ACTUAL EMERGENCY:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-red-800 dark:text-red-200">
            <li><strong>Follow official emergency instructions from government authorities and first responders</strong></li>
            <li><strong>Call 911 (or your local emergency number) if you are in immediate danger</strong></li>
            <li><strong>Evacuate if instructed to do so by authorities, regardless of any plans in Be Prepared</strong></li>
            <li><strong>Do not delay emergency response to consult Be Prepared or any app</strong></li>
            <li><strong>Your life and safety are your responsibility - trust your judgment and follow official guidance</strong></li>
          </ul>
        </div>

        <p className="mt-6">
          Be Prepared is a planning and preparation tool for use <strong>before emergencies occur</strong>. 
          It is not designed for real-time emergency response. In actual emergency situations, your safety 
          depends on your judgment, official instructions, and immediate action - not on consulting any app or service.
        </p>

        <h3 className="text-xl font-semibold mt-8 mb-4">4.11 No Guarantee of Preparedness or Survival</h3>
        <p>
          <strong>Using Be Prepared and following our recommendations does not guarantee that you will be 
          adequately prepared for emergencies or that you will survive emergency situations.</strong>
        </p>
        <p className="mt-3">
          Emergency preparedness requires ongoing effort, regular practice, continuous learning, proper 
          equipment maintenance, physical fitness, mental preparation, and many other factors beyond the 
          scope of any software application. Be Prepared is one tool among many that you should use as 
          part of a comprehensive approach to emergency preparedness.
        </p>

        <h3 className="text-xl font-semibold mt-8 mb-4">4.12 Product Recommendations Disclaimer</h3>
        <p>
          Product recommendations provided by Be Prepared are suggestions only. We do not manufacture, 
          sell, or warranty any products recommended by the Service. You are solely responsible for:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Verifying the suitability of products for your needs</li>
          <li>Researching product quality, safety, and reviews</li>
          <li>Understanding how to properly use any equipment or supplies</li>
          <li>Maintaining and testing equipment regularly</li>
          <li>Replacing expired or damaged supplies</li>
        </ul>
        <p className="mt-4">
          <strong>We are not responsible for defective products, product failures, or injuries resulting 
          from products purchased based on our recommendations.</strong>
        </p>

        <h3 className="text-xl font-semibold mt-8 mb-4">4.13 INDEMNIFICATION</h3>
        <p>
          You agree to indemnify, defend, and hold harmless the Company and its officers, directors, 
          employees, agents, contractors, and affiliates from and against any and all claims, damages, 
          liabilities, losses, costs, and expenses (including reasonable attorneys&apos; fees) arising 
          out of or relating to:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Your use of the Service</li>
          <li>Your reliance on any content or recommendations provided by the Service</li>
          <li>Your implementation of any preparedness plans or strategies</li>
          <li>Your violation of these Terms</li>
          <li>Your violation of any applicable laws or regulations</li>
          <li>Your violation of any rights of third parties</li>
          <li>Any harm or damages resulting from your actions or inactions during emergencies</li>
        </ul>

        <div className="mt-8 p-6 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-r">
          <p className="font-bold text-yellow-900 dark:text-yellow-100 mb-3">
            ⚠️ CRITICAL REMINDER
          </p>
          <p className="text-yellow-800 dark:text-yellow-200 leading-relaxed">
            Emergency situations are unpredictable and potentially life-threatening. Your safety depends 
            on your own judgment, preparedness actions, and response decisions. Be Prepared is a tool to 
            support your planning efforts, but it cannot replace common sense, professional guidance, 
            official emergency instructions, or your own critical thinking. 
            <strong> When your life is at risk, follow official emergency instructions and contact 
            emergency services immediately (911 in the United States).</strong>
          </p>
        </div>
      </LegalSection>

      {/* Acceptable Use */}
      <LegalSection
        id="acceptable-use"
        title="5. Acceptable Use Policy"
        summary="You agree to use Be Prepared legally and responsibly. Prohibited activities include illegal use, harming others, violating security, spamming, and abusing the Service. Violations may result in account termination."
      >
        <p>
          You agree to use the Service only for lawful purposes and in accordance with these Terms. 
          You agree not to:
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">5.1 Prohibited Activities</h3>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Use the Service for any illegal purpose or in violation of any local, state, national, or international law</li>
          <li>Violate or infringe upon the intellectual property rights of others</li>
          <li>Harass, abuse, threaten, or harm others, or incite violence</li>
          <li>Transmit any content that is unlawful, harmful, threatening, abusive, defamatory, vulgar, obscene, or otherwise objectionable</li>
          <li>Attempt to gain unauthorized access to the Service, other user accounts, or computer systems</li>
          <li>Interfere with or disrupt the Service or servers connected to the Service</li>
          <li>Use any automated system (bots, scrapers, etc.) to access the Service without our permission</li>
          <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
          <li>Create multiple accounts to circumvent subscription limits or restrictions</li>
          <li>Share your account credentials with others or allow others to use your account</li>
          <li>Use the Service to distribute spam, malware, or other harmful content</li>
          <li>Impersonate any person or entity or falsely represent your affiliation with any person or entity</li>
          <li>Collect or harvest personal information of other users without their consent</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">5.2 Enforcement</h3>
        <p>
          We reserve the right to investigate and take appropriate action against anyone who violates 
          this Acceptable Use Policy, including:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Removing or disabling content that violates these Terms</li>
          <li>Suspending or terminating accounts</li>
          <li>Reporting violations to law enforcement authorities</li>
          <li>Taking legal action to protect our rights and the rights of other users</li>
        </ul>
      </LegalSection>

      {/* Affiliate Disclosure */}
      <LegalSection
        id="affiliate"
        title="6. Affiliate Disclosure"
        summary="Be Prepared participates in affiliate programs including Amazon Associates. We earn commissions when you purchase products through our links at no extra cost to you. This doesn't influence our AI recommendations, which are based on quality and suitability for emergency preparedness."
      >
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r mb-4">
          <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            💼 FTC Required Disclosure
          </p>
          <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">
            <strong>As an Amazon Associate, we earn from qualifying purchases.</strong> This means we 
            may receive commissions when you purchase products through links on our Service.
          </p>
        </div>

        <h3 className="text-xl font-semibold mt-6 mb-3">6.1 Affiliate Relationships</h3>
        <p>
          Be Prepared participates in affiliate marketing programs, including the Amazon Associates 
          Program and other third-party affiliate programs. This means that when you click on certain 
          links to products or services and make a purchase, <strong>we may receive a commission from 
          the seller at no additional cost to you.</strong>
        </p>
        <p className="mt-3">
          These affiliate relationships allow us to offer the Service at low subscription prices while 
          continuing to improve and expand our features.
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">6.2 Independence of Recommendations</h3>
        <p>
          <strong>Our affiliate relationships do not influence our product recommendations.</strong> 
          We only recommend products and services that we believe will provide value to our users based on:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>AI-powered matching algorithms that prioritize suitability for your specific needs</li>
          <li>Quality, safety, and reliability of products</li>
          <li>Positive user reviews and ratings</li>
          <li>Emergency preparedness best practices and professional standards</li>
          <li>Value for money and cost-effectiveness</li>
        </ul>
        <p className="mt-4">
          However, you should be aware that we may receive compensation when you purchase through our 
          affiliate links. You are encouraged to research products independently and compare prices 
          across multiple retailers.
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">6.3 Third-Party Seller Responsibility</h3>
        <p>
          When you purchase products through our affiliate links, you are purchasing from third-party 
          sellers (such as Amazon). <strong>We are not the seller, manufacturer, or distributor of 
          these products.</strong> All sales are subject to the terms and conditions, return policies, 
          and warranties of the third-party seller.
        </p>
        <p className="mt-3">
          We are not responsible for:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Product quality, safety, or performance</li>
          <li>Shipping, delivery, or fulfillment</li>
          <li>Returns, refunds, or customer service for products</li>
          <li>Product warranties or defects</li>
          <li>Changes in product availability or pricing</li>
        </ul>
        <p className="mt-4">
          For issues with products purchased through affiliate links, please contact the seller directly.
        </p>
      </LegalSection>

      {/* Intellectual Property */}
      <LegalSection
        id="intellectual-property"
        title="7. Intellectual Property Rights"
        summary="Be Prepared owns all content, features, and functionality of the Service. You may not copy, modify, or redistribute our content without permission. You retain ownership of your user-generated content but grant us a license to use it to provide the Service."
      >
        <h3 className="text-xl font-semibold mt-6 mb-3">7.1 Company Content</h3>
        <p>
          The Service and its entire contents, features, and functionality (including but not limited to 
          all information, software, code, text, displays, graphics, photographs, video, audio, design, 
          presentation, selection, and arrangement) are owned by 6 Foot Media LLC, its licensors, or 
          other providers of such material and are protected by United States and international copyright, 
          trademark, patent, trade secret, and other intellectual property laws.
        </p>
        <p className="mt-4">
          <strong>You may not:</strong>
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Copy, modify, reproduce, republish, upload, post, transmit, distribute, or create derivative works from any content from the Service</li>
          <li>Use any automated system to access, scrape, or extract data from the Service</li>
          <li>Remove, alter, or obscure any copyright, trademark, or other proprietary rights notices</li>
          <li>Use the Service&apos;s content for commercial purposes without our written permission</li>
          <li>Frame or mirror any content from the Service on another website</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">7.2 Trademarks</h3>
        <p>
          The Be Prepared name, logo, and all related names, logos, product and service names, designs, 
          and slogans are trademarks of 6 Foot Media LLC or its affiliates. You may not use these marks 
          without our prior written permission.
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">7.3 Limited License</h3>
        <p>
          Subject to your compliance with these Terms, we grant you a limited, non-exclusive, 
          non-transferable, revocable license to access and use the Service for your personal, 
          non-commercial use only. This license does not include any right to:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Resell or make commercial use of the Service or its content</li>
          <li>Download or copy content for any purpose other than your personal emergency preparedness</li>
          <li>Use any data mining, robots, or similar data gathering or extraction methods</li>
          <li>Use the Service in any manner that could damage, disable, overburden, or impair the Service</li>
        </ul>
      </LegalSection>

      {/* User-Generated Content */}
      <LegalSection
        id="user-content"
        title="8. User-Generated Content"
        summary="You retain ownership of content you create (plans, notes, customizations) but grant us a license to use it to provide the Service. You're responsible for your content and must not upload illegal or harmful content."
      >
        <h3 className="text-xl font-semibold mt-6 mb-3">8.1 Your Content</h3>
        <p>
          You retain ownership of any emergency plans, notes, customizations, inventory data, and other 
          content you create using the Service (&quot;Your Content&quot;). However, by using the Service, you grant 
          us certain rights to use Your Content as described below.
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">8.2 License Grant</h3>
        <p>
          By creating or uploading content to the Service, you grant 6 Foot Media LLC a worldwide, 
          non-exclusive, royalty-free, transferable, sublicensable license to use, reproduce, modify, 
          adapt, publish, translate, create derivative works from, distribute, and display Your Content 
          in connection with operating and providing the Service.
        </p>
        <p className="mt-3">
          This license is necessary for us to:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Store and display your plans and data</li>
          <li>Process your content through our AI systems</li>
          <li>Enable plan sharing features (if you use them)</li>
          <li>Improve our AI algorithms (using anonymized, aggregated data)</li>
          <li>Provide technical support</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">8.3 Content Responsibility</h3>
        <p>
          You are solely responsible for Your Content. You represent and warrant that:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>You own or have the necessary rights to use and authorize us to use Your Content</li>
          <li>Your Content does not violate any applicable laws or regulations</li>
          <li>Your Content does not infringe or violate the intellectual property rights of any third party</li>
          <li>Your Content does not contain any viruses, malware, or other harmful components</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">8.4 Content Removal</h3>
        <p>
          We reserve the right (but have no obligation) to remove or disable access to any content, 
          including Your Content, that we determine in our sole discretion violates these Terms or 
          is otherwise objectionable.
        </p>
      </LegalSection>

      {/* Dispute Resolution */}
      <LegalSection
        id="dispute-resolution"
        title="9. Dispute Resolution and Arbitration"
        summary="Most disputes must be resolved through binding arbitration (not court lawsuits). You waive your right to jury trials and class action lawsuits. New Jersey law governs these Terms."
      >
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r mb-4">
          <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            ⚖️ Arbitration Agreement
          </p>
          <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">
            By agreeing to these Terms, you agree to resolve disputes through binding arbitration 
            instead of court lawsuits, except for certain limited exceptions.
          </p>
        </div>

        <h3 className="text-xl font-semibold mt-6 mb-3">9.1 Governing Law</h3>
        <p>
          These Terms and any dispute or claim arising out of or related to these Terms or the Service 
          shall be governed by and construed in accordance with the laws of the State of New Jersey, 
          United States, without regard to its conflict of law provisions.
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">9.2 Binding Arbitration</h3>
        <p>
          <strong>Except as provided below, any dispute, controversy, or claim arising out of or relating 
          to these Terms or the Service shall be resolved by binding arbitration</strong> administered by 
          a nationally recognized arbitration organization, in accordance with its commercial arbitration rules.
        </p>
        <p className="mt-3">
          The arbitration shall be conducted in New Jersey, United States, or at another location 
          mutually agreed upon by the parties. The arbitrator&apos;s decision shall be final and binding, 
          and judgment on the award may be entered in any court having jurisdiction.
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">9.3 Exceptions to Arbitration</h3>
        <p>
          Either party may seek injunctive or other equitable relief in court to protect intellectual 
          property rights or prevent unauthorized access to the Service. Additionally, either party may 
          bring an individual action in small claims court if the claim qualifies.
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">9.4 Class Action Waiver</h3>
        <p>
          <strong>YOU AGREE THAT ANY ARBITRATION OR COURT PROCEEDING SHALL BE LIMITED TO THE DISPUTE 
          BETWEEN YOU AND THE COMPANY INDIVIDUALLY.</strong> To the fullest extent permitted by law:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>You waive your right to participate in a class action lawsuit or class-wide arbitration</li>
          <li>You waive your right to act as a class representative or class member in any class action</li>
          <li>Claims may not be consolidated or joined with claims of other users</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">9.5 Jury Trial Waiver</h3>
        <p>
          <strong>YOU AND THE COMPANY EACH WAIVE THE RIGHT TO A JURY TRIAL.</strong> Any dispute that 
          proceeds in court rather than arbitration shall be decided by a judge without a jury.
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">9.6 Time Limitation on Claims</h3>
        <p>
          You agree that any claim or cause of action arising out of or related to the Service or these 
          Terms must be filed within one (1) year after the claim or cause of action arose, or it will 
          be permanently barred.
        </p>
      </LegalSection>

      {/* Termination */}
      <LegalSection
        id="termination"
        title="10. Termination and Suspension"
        summary="We can suspend or terminate your account if you violate these Terms. You can cancel your account anytime. Upon termination, you lose access to the Service but some provisions of these Terms survive."
      >
        <h3 className="text-xl font-semibold mt-6 mb-3">10.1 Termination by You</h3>
        <p>
          You may cancel your account at any time through your account settings or by contacting us 
          at privacy@beprepared.ai. Upon cancellation:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Your subscription will not renew, but you will retain access until the end of your billing period</li>
          <li>Your account will be downgraded to the Free tier after your billing period ends</li>
          <li>You may request deletion of your account and data by submitting a request through our in-app form</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">10.2 Termination by Company</h3>
        <p>
          We reserve the right to suspend or terminate your account and access to the Service at any 
          time, with or without notice, for any reason, including but not limited to:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Violation of these Terms or our Acceptable Use Policy</li>
          <li>Fraudulent or illegal activity</li>
          <li>Failure to pay subscription fees</li>
          <li>Abuse of the Service or harm to other users</li>
          <li>Extended periods of inactivity</li>
          <li>At our sole discretion for operational, legal, or business reasons</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">10.3 Effect of Termination</h3>
        <p>
          Upon termination or suspension of your account:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Your right to use the Service immediately ceases</li>
          <li>We may delete your content and data after a reasonable period</li>
          <li>You remain liable for any outstanding payments or obligations</li>
          <li>We are not liable for any loss of data or content resulting from termination</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">10.4 Survival</h3>
        <p>
          The following provisions survive termination of these Terms: Disclaimers and Limitation of 
          Liability, Indemnification, Intellectual Property Rights, Dispute Resolution, and any other 
          provisions that by their nature should survive.
        </p>
      </LegalSection>

      {/* Changes to Terms */}
      <LegalSection
        id="changes"
        title="11. Changes to Terms"
        summary="We may update these Terms periodically. We'll notify you of material changes via email or prominent notice. Continued use after changes means you accept the new terms."
      >
        <p>
          We reserve the right to modify or update these Terms at any time. When we make changes, 
          we will update the &quot;Last Updated&quot; date at the top of this page.
        </p>
        <p className="mt-4">
          <strong>For material changes, we will provide notice by:</strong>
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Sending an email to the address associated with your account</li>
          <li>Posting a prominent notice on the Service</li>
          <li>Requiring you to accept the updated Terms before continuing to use the Service</li>
        </ul>
        <p className="mt-4">
          Your continued use of the Service after the effective date of any changes constitutes your 
          acceptance of the updated Terms. If you do not agree to the updated Terms, you must stop 
          using the Service and may cancel your account.
        </p>
        <p className="mt-4">
          <strong>It is your responsibility to review these Terms periodically.</strong> We recommend 
          checking this page whenever you access the Service to ensure you are aware of any changes.
        </p>
      </LegalSection>

      {/* Contact */}
      <LegalSection
        id="contact"
        title="12. Contact Information"
        summary="For questions about these Terms, contact us at privacy@beprepared.ai. We respond to inquiries within 30 days."
      >
        <p>
          If you have any questions, concerns, or requests regarding these Terms of Service, 
          please contact us:
        </p>
        <div className="mt-6 p-6 bg-muted rounded-lg border">
          <p className="font-semibold text-lg mb-3">6 Foot Media LLC DBA Be Prepared</p>
          <p className="mb-2">
            <strong>General Inquiries:</strong>{' '}
            <a href="mailto:privacy@beprepared.ai" className="text-primary hover:underline">
              privacy@beprepared.ai
            </a>
          </p>
          <p className="mb-2">
            <strong>Legal Notices:</strong> Must be sent to the email address above
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            We will respond to your inquiry within 30 days. For urgent matters, please mark your 
            email as &quot;Urgent&quot; in the subject line.
          </p>
        </div>

        <div className="mt-8 p-6 bg-primary/10 border-l-4 border-primary rounded-r">
          <p className="font-semibold text-primary mb-2">
            📋 Summary
          </p>
          <p className="text-foreground/90 text-sm leading-relaxed">
            These Terms of Service govern your use of Be Prepared. By using our Service, you agree to 
            these terms, including our extensive disclaimers regarding AI-generated emergency preparedness 
            advice. You use the Service at your own risk and must consult professional sources for 
            life-safety decisions. We are not liable for injuries, deaths, or property loss resulting 
            from your use of or reliance on the Service.
          </p>
        </div>
      </LegalSection>
    </LegalPageLayout>
  );
}

