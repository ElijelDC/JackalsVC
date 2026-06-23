-- Mark coach roster accounts with a dedicated membership status
UPDATE "Membership"
SET "status" = 'COACH'
WHERE "userId" IN (
  SELECT "userId" FROM "ClubMember"
  WHERE "rosterRole" = 'COACH' AND "userId" IS NOT NULL
)
AND "status" = 'ACTIVE';
