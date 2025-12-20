import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file BEFORE importing db
config({ path: resolve(process.cwd(), '.env.local') });

import { db } from '../src/db';
import { consultingServices } from '../src/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Seed Default Consulting Service
 * Creates a default "Emergency Preparedness Consulting" service offering
 */

const DEFAULT_SERVICE = {
  name: 'Emergency Preparedness Consulting',
  description: 'Get personalized expert guidance on your emergency preparedness journey',
  genericDescription: `Many of our customers hire us for one-on-one consulting to:

- Review and optimize their emergency preparedness plan
- Get advice on organizing and storing emergency supplies
- Learn what to build or DIY for their specific situation
- Improve existing preparedness systems and close gaps
- Develop family communication and evacuation procedures
- Understand local risks and tailor plans accordingly

Our consultants have years of experience in emergency management, survival training, and disaster response. We'll work with you to create a customized action plan that fits your family's unique needs, location, and preparedness level.`,
  qualifyingQuestions: [
    {
      question: 'What would you like to discuss during your consulting session?',
      type: 'textarea',
      placeholder:
        'Example: I want to organize my supplies, improve my evacuation plan, etc.',
    },
    {
      question: 'What is your current preparedness level?',
      type: 'select',
      options: [
        'None - Just getting started',
        'Basic - Have some supplies',
        'Intermediate - Have plan and supplies',
        'Advanced - Comprehensive preparedness',
      ],
    },
    {
      question: 'What outcome are you hoping for from this consulting session?',
      type: 'textarea',
      placeholder:
        'Example: I want a clear action plan, confidence in my preparedness, etc.',
    },
  ],
  isGeneric: true,
  targetScenarios: null,
  bundleId: null,
  isActive: true,
  displayOrder: 0,
};

async function seedDefaultConsultingService(): Promise<void> {
  try {
    console.log('🌱 Seeding default consulting service...\n');

    // Check if a generic consulting service already exists
    const existingServices = await db
      .select()
      .from(consultingServices)
      .where(eq(consultingServices.isGeneric, true))
      .limit(1);

    if (existingServices.length > 0) {
      console.log(
        '✅ Generic consulting service already exists (skipping seed):'
      );
      console.log(`   Name: ${existingServices[0].name}`);
      console.log(`   ID: ${existingServices[0].id}`);
      console.log(
        `   Active: ${existingServices[0].isActive ? 'Yes' : 'No'}\n`
      );
      return;
    }

    // Insert default service
    const [inserted] = await db
      .insert(consultingServices)
      .values(DEFAULT_SERVICE)
      .returning();

    console.log('✅ Default consulting service created successfully!\n');
    console.log('Service Details:');
    console.log(`   Name: ${inserted.name}`);
    console.log(`   ID: ${inserted.id}`);
    console.log(`   Description: ${inserted.description}`);
    console.log(
      `   Questions: ${(inserted.qualifyingQuestions as Array<unknown>).length} qualifying questions`
    );
    console.log(`   Status: ${inserted.isActive ? 'Active' : 'Inactive'}`);
    console.log(`   Type: ${inserted.isGeneric ? 'Generic' : 'Bundle-Specific'}\n`);

    console.log('Next Steps:');
    console.log('1. Visit /admin/consulting to manage consulting services');
    console.log('2. Visit /consulting to see the public consulting page');
    console.log('3. Edit the service to customize questions and description\n');
  } catch (error) {
    console.error('❌ Error seeding default consulting service:', error);
    throw error;
  }
}

// Run the seed script
seedDefaultConsultingService()
  .then(() => {
    console.log('✨ Seed script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seed script failed:', error);
    process.exit(1);
  });
