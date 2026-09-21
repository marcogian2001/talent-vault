-- The preferences quiz is gone and its answers are meaningless to the new onboarding
-- questionnaire, but the table holds real user rows: rename instead of dropping so the
-- data survives a rollback. Nothing reads student_profiles_legacy; drizzle-kit ignores
-- it because it is no longer in the schema snapshot.
ALTER TABLE "student_profiles" RENAME TO "student_profiles_legacy";
