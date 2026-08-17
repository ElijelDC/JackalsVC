-- Past one-off sessions should not hold a public slug forever.
-- Keep slug indexed for lookups, but allow a new live session to reuse it.
DROP INDEX "TrialSession_slug_key";
CREATE INDEX "TrialSession_slug_idx" ON "TrialSession"("slug");
