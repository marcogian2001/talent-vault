import { pgTable, text, integer, boolean, timestamp, json } from 'drizzle-orm/pg-core';

export const opportunities = pgTable('opportunities', {
  id: text('id').primaryKey(),
  category: text('category').notNull(),
  labelTitle: text('label_title').notNull(), // e.g., "Private Residency 1"
  imagePath: text('image_path').notNull(),
  location: text('location').notNull(),
  country: text('country'),
  engagementType: text('engagement_type').notNull(), // Single Service, Seasonal, etc.
  compensationText: text('compensation_text').notNull(),
  compensationNumeric: integer('compensation_numeric'), // for slider filtering
  currency: text('currency').default('€'),
  tags: json('tags').$type<string[]>(), // stored as JSON array
  allowCounterProposal: boolean('allow_counter_proposal').default(false),
  // Additional optional fields depending on category
  position: text('position'),
  propertyName: text('property_name'),
  guestCapacity: integer('guest_capacity'),
  accommodationDetails: text('accommodation_details'),
  benefits: text('benefits'),
  vesselName: text('vessel_name'),
  flag: text('flag'),
  crewSize: integer('crew_size'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
});

export const applications = pgTable('applications', {
  id: text('id').primaryKey(),
  opportunityId: text('opportunity_id').notNull().references(() => opportunities.id),
  type: text('type').notNull(), // 'apply', 'counter'
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  notes: text('notes'),
  proposedCompensation: text('proposed_compensation'),
  availabilityWindow: text('availability_window'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
});
