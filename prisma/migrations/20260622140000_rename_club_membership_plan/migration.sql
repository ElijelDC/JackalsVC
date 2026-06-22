-- Rename legacy membership plan names to the current season label.
UPDATE "MembershipPlan"
SET "name" = 'Club Membership 2026/27'
WHERE "name" IN ('Season Membership', 'Club Membership');
