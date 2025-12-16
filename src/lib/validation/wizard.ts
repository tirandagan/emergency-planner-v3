// Wizard Validation Schemas using Zod
// Step-by-step validation with helpful error messages

import { z } from 'zod';

/**
 * Scenario type validation
 */
export const scenarioTypeSchema = z.enum([
  'natural-disaster',
  'emp-grid-down',
  'pandemic',
  'nuclear',
  'civil-unrest',
  'multi-year-sustainability',
], {
  errorMap: () => ({ message: 'Please select a valid scenario type' }),
});

/**
 * Step 1: Scenario Selection Schema
 */
export const scenarioSelectionSchema = z.object({
  scenarios: z
    .array(scenarioTypeSchema)
    .min(1, 'Please select at least one scenario')
    .max(6, 'You can select up to 6 scenarios'),
});

/**
 * Family member validation
 */
export const familyMemberSchema = z.object({
  age: z
    .number({
      required_error: 'Age is required',
      invalid_type_error: 'Age must be a number',
    })
    .int('Age must be a whole number')
    .min(0, 'Age must be 0 or greater')
    .max(120, 'Age must be 120 or less'),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say'], {
    errorMap: () => ({ message: 'Please select a gender option' }),
  }),
  medicalConditions: z
    .string()
    .max(500, 'Medical conditions description must be 500 characters or less')
    .optional(),
  specialNeeds: z
    .string()
    .max(500, 'Special needs description must be 500 characters or less')
    .optional(),
});

/**
 * Step 2: Personnel Configuration Schema
 */
export const personnelConfigurationSchema = z.object({
  familyMembers: z
    .array(familyMemberSchema)
    .min(1, 'Please add at least one person')
    .max(20, 'Maximum of 20 people allowed'),
});

/**
 * Location data validation
 */
export const locationDataSchema = z.object({
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State/Province is required'),
  country: z.string().min(1, 'Country is required'),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  climateZone: z.string().min(1, 'Climate zone is required'),
  fullAddress: z.string().min(1, 'Full address is required'),
  placeId: z.string().min(1, 'Google Place ID is required'),
  rawPlaceData: z.any().optional(), // Google Places response
});

/**
 * Step 3: Location & Context Schema
 */
export const locationContextSchema = z.object({
  location: locationDataSchema,
  durationDays: z
    .number({
      required_error: 'Duration is required',
      invalid_type_error: 'Duration must be a number',
    })
    .int('Duration must be a whole number')
    .refine(
      (val) => [3, 7, 14, 30, 90, 365].includes(val),
      'Duration must be 3, 7, 14, 30, 90, or 365 days'
    ),
  homeType: z.enum(['apartment', 'house', 'condo', 'rural', 'mobile', 'other'], {
    errorMap: () => ({ message: 'Please select a home type' }),
  }),
  existingPreparedness: z.enum(['none', 'basic', 'moderate', 'advanced'], {
    errorMap: () => ({ message: 'Please select your current preparedness level' }),
  }),
  budgetTier: z.enum(['LOW', 'MEDIUM', 'HIGH'], {
    errorMap: () => ({ message: 'Please select a budget tier' }),
  }),
});

/**
 * Complete wizard form data validation
 * Combines all three steps
 */
export const wizardFormDataSchema = scenarioSelectionSchema
  .merge(personnelConfigurationSchema)
  .merge(locationContextSchema);

/**
 * Supply item validation
 */
export const supplyItemSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  item: z.string().min(1, 'Item name is required'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unit: z.string().min(1, 'Unit is required'),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  reasoning: z.string().min(1, 'Reasoning is required'),
});

/**
 * Waypoint validation
 */
export const waypointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  name: z.string().min(1, 'Waypoint name is required'),
  description: z.string().optional(),
});

/**
 * Route validation
 */
export const routeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Route name is required'),
  waypoints: z.array(waypointSchema).min(2, 'Route must have at least 2 waypoints'),
  estimatedDuration: z.string().min(1, 'Duration is required'),
  distance: z.string().min(1, 'Distance is required'),
  notes: z.string().default(''),
});

/**
 * Kit item validation
 */
export const kitItemSchema = z.object({
  supplyItemId: z.string().optional(),
  productId: z.string().optional(),
  name: z.string().min(1, 'Item name is required'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  category: z.string().min(1, 'Category is required'),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  estimatedCost: z.number().nonnegative().optional(),
  purchaseUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
});

/**
 * Skill resource validation
 */
export const skillResourceSchema = z.object({
  skillId: z.string().min(1),
  skillName: z.string().min(1, 'Skill name is required'),
  category: z.string().min(1, 'Category is required'),
  resourceUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  description: z.string().optional(),
});

/**
 * Emergency contact validation
 */
export const emergencyContactSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Contact name is required'),
  relationship: z.string().min(1, 'Relationship is required'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  notes: z.string().optional(),
});

/**
 * Generated kit validation
 * Validates the complete AI-generated mission plan
 */
export const generatedKitSchema = z.object({
  scenarios: z.array(scenarioTypeSchema).min(1),
  summary: z.string().min(10, 'Summary must be at least 10 characters'),
  readinessScore: z.number().int().min(0).max(100),
  simulationLog: z.string().min(10, 'Simulation log must be at least 10 characters'),
  rationPlan: z.string().min(10, 'Ration plan must be at least 10 characters'),
  supplies: z.array(supplyItemSchema).min(1, 'At least one supply item is required'),
  items: z.array(kitItemSchema).default([]),
  requiredSkills: z.array(z.string()).default([]),
  evacuationRoutes: z.array(routeSchema).default([]),
  skillResources: z.array(skillResourceSchema).default([]),
  emergencyContacts: z.array(emergencyContactSchema).optional(),
});

/**
 * Helper function to validate step data
 * Returns { success: boolean, errors: Record<string, string> }
 */
export function validateStep(
  step: number,
  data: any
): { success: boolean; errors: Record<string, string> } {
  try {
    switch (step) {
      case 0:
        scenarioSelectionSchema.parse(data);
        break;
      case 1:
        personnelConfigurationSchema.parse(data);
        break;
      case 2:
        locationContextSchema.parse(data);
        break;
      default:
        return { success: false, errors: { step: 'Invalid step number' } };
    }
    return { success: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { unknown: 'Validation failed' } };
  }
}

/**
 * Helper function to validate complete wizard form
 */
export function validateWizardForm(data: any): {
  success: boolean;
  errors: Record<string, string>;
} {
  try {
    wizardFormDataSchema.parse(data);
    return { success: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { unknown: 'Validation failed' } };
  }
}
