import { pgTable, text, integer, boolean, timestamp, json, index, uniqueIndex } from 'drizzle-orm/pg-core';
// Relative, not aliased: drizzle-kit loads this file outside the Next.js resolver.
import type { AnswerValue, QuestionConfig, QuestionOption } from '../lib/onboarding-types';

// --- better-auth tables ---

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  role: text('role').notNull().default('student'), // 'student' | 'admin'
  isSuperAdmin: boolean('is_super_admin').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  idToken: text('id_token'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// --- app tables ---

// --- chef onboarding questionnaire ---
// The questions are authored by admins, so everything about them is data, not code.

export const onboardingQuestions = pgTable('onboarding_questions', {
  id: text('id').primaryKey(),
  // Stable slug: lets the seed script stay idempotent and survives label edits.
  key: text('key').notNull().unique(),
  // 'short_text' | 'long_text' | 'single_choice' | 'multi_choice' | 'yes_no'
  // | 'number' | 'date' | 'file' | 'files'
  type: text('type').notNull(),
  label: text('label').notNull(),
  helpText: text('help_text'),
  placeholder: text('placeholder'),
  // Italian wording, optional: chefs fall back to the columns above when it is missing.
  labelIt: text('label_it'),
  helpTextIt: text('help_text_it'),
  placeholderIt: text('placeholder_it'),
  required: boolean('required').notNull().default(true),
  options: json('options').$type<QuestionOption[]>(),
  config: json('config').$type<QuestionConfig>(),
  sortOrder: integer('sort_order').notNull().default(0),
  status: text('status').notNull().default('active'), // 'active' | 'archived'
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  index('onboarding_questions_status_order_idx').on(t.status, t.sortOrder),
]);

// A row exists here only when the question is genuinely answered: clearing an answer
// deletes the row. File questions keep `value` null and count on their file rows.
export const onboardingAnswers = pgTable('onboarding_answers', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  questionId: text('question_id').notNull().references(() => onboardingQuestions.id, { onDelete: 'cascade' }),
  value: json('value').$type<AnswerValue>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  uniqueIndex('onboarding_answers_user_question_uq').on(t.userId, t.questionId),
  index('onboarding_answers_question_idx').on(t.questionId),
]);

export const onboardingAnswerFiles = pgTable('onboarding_answer_files', {
  id: text('id').primaryKey(),
  answerId: text('answer_id').notNull().references(() => onboardingAnswers.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  pathname: text('pathname').notNull(),
  originalName: text('original_name').notNull(),
  contentType: text('content_type').notNull(),
  size: integer('size').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('onboarding_answer_files_answer_idx').on(t.answerId),
]);

// One row per chef, written on the first admin decision. A chef who finished onboarding
// and has no row yet is simply waiting for review, so "pending" is never backfilled.
export const chefReviews = pgTable('chef_reviews', {
  userId: text('user_id').primaryKey().references(() => user.id, { onDelete: 'cascade' }),
  status: text('status').notNull(), // 'pending' | 'approved' | 'rejected'
  rejectionReason: text('rejection_reason'),
  // Questions the admin wants corrected; kept while the resubmission is being reviewed.
  flaggedQuestionIds: json('flagged_question_ids').$type<string[]>(),
  reviewedByUserId: text('reviewed_by_user_id').references(() => user.id),
  reviewedAt: timestamp('reviewed_at'),
  resubmittedAt: timestamp('resubmitted_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const adminInvites = pgTable('admin_invites', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  token: text('token').notNull().unique(),
  invitedByUserId: text('invited_by_user_id').notNull().references(() => user.id),
  status: text('status').notNull().default('pending'), // 'pending' | 'accepted' | 'revoked' | 'expired'
  expiresAt: timestamp('expires_at').notNull(),
  acceptedAt: timestamp('accepted_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

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
  createdByUserId: text('created_by_user_id').references(() => user.id),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().$onUpdate(() => new Date()),
});

export const applications = pgTable('applications', {
  id: text('id').primaryKey(),
  opportunityId: text('opportunity_id').notNull().references(() => opportunities.id),
  studentUserId: text('student_user_id').notNull().references(() => user.id),
  type: text('type').notNull(), // 'apply', 'counter'
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  notes: text('notes'),
  proposedCompensation: text('proposed_compensation'),
  availabilityWindow: text('availability_window'),
  status: text('status').notNull().default('pending'), // 'pending' | 'reviewing' | 'accepted' | 'rejected'
  reviewedByUserId: text('reviewed_by_user_id').references(() => user.id),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().$onUpdate(() => new Date()),
});
