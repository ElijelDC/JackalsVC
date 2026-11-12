-- Roster entries so Nikita and Lorin can register.
-- Nikita → D2 (Division 2 men). Lorin → D3W (Division 3 women).
-- VLY81021 and VLY81022 are placeholders. Replace them with the real VLY
-- numbers in Admin → Registered Members before each player signs up.

UPDATE "ClubMember"
SET
  "trainingTeamKey" = (
    SELECT "key" FROM "TrainingSquad"
    WHERE "active" = 1
      AND (
        "key" = 'DIV2_MENS'
        OR upper("key") IN ('D2', 'DIV2', 'DIVISION_2_MENS')
        OR upper(replace("name", '''', '')) IN ('D2', 'DIVISION 2', 'DIVISION 2 MENS')
      )
    ORDER BY CASE "key" WHEN 'DIV2_MENS' THEN 0 WHEN 'D2' THEN 1 ELSE 2 END, "sortOrder"
    LIMIT 1
  ),
  "active" = 1,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE lower(trim("name")) = 'nikita jaremkucks'
  AND EXISTS (
    SELECT 1 FROM "TrainingSquad"
    WHERE "active" = 1
      AND (
        "key" = 'DIV2_MENS'
        OR upper("key") IN ('D2', 'DIV2', 'DIVISION_2_MENS')
        OR upper(replace("name", '''', '')) IN ('D2', 'DIVISION 2', 'DIVISION 2 MENS')
      )
  );

UPDATE "ClubMember"
SET
  "trainingTeamKey" = (
    SELECT "key" FROM "TrainingSquad"
    WHERE "active" = 1
      AND (
        "key" = 'DIV3_WOMENS'
        OR upper("key") IN ('D3W', 'DIV3_WOMENS', 'DIVISION_3_WOMENS')
        OR upper(replace("name", '''', '')) IN ('D3W', 'DIVISION 3 WOMENS', 'DIVISION 3 WOMEN')
      )
    ORDER BY CASE "key" WHEN 'DIV3_WOMENS' THEN 0 WHEN 'D3W' THEN 1 ELSE 2 END, "sortOrder"
    LIMIT 1
  ),
  "active" = 1,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE lower(trim("name")) = 'lorin bagayan'
  AND EXISTS (
    SELECT 1 FROM "TrainingSquad"
    WHERE "active" = 1
      AND (
        "key" = 'DIV3_WOMENS'
        OR upper("key") IN ('D3W', 'DIV3_WOMENS', 'DIVISION_3_WOMENS')
        OR upper(replace("name", '''', '')) IN ('D3W', 'DIVISION 3 WOMENS', 'DIVISION 3 WOMEN')
      )
  );

INSERT INTO "ClubMember" (
  "id",
  "vlyNumber",
  "name",
  "active",
  "rosterRole",
  "trainingTeamKey",
  "createdAt",
  "updatedAt"
)
SELECT
  'cm_nikita_jaremkucks',
  'VLY81021',
  'Nikita Jaremkucks',
  1,
  'PLAYER',
  (
    SELECT "key" FROM "TrainingSquad"
    WHERE "active" = 1
      AND (
        "key" = 'DIV2_MENS'
        OR upper("key") IN ('D2', 'DIV2', 'DIVISION_2_MENS')
        OR upper(replace("name", '''', '')) IN ('D2', 'DIVISION 2', 'DIVISION 2 MENS')
      )
    ORDER BY CASE "key" WHEN 'DIV2_MENS' THEN 0 WHEN 'D2' THEN 1 ELSE 2 END, "sortOrder"
    LIMIT 1
  ),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "ClubMember" WHERE lower(trim("name")) = 'nikita jaremkucks'
)
AND NOT EXISTS (
  SELECT 1 FROM "ClubMember" WHERE "vlyNumber" = 'VLY81021'
)
AND EXISTS (
  SELECT 1 FROM "TrainingSquad"
  WHERE "active" = 1
    AND (
      "key" = 'DIV2_MENS'
      OR upper("key") IN ('D2', 'DIV2', 'DIVISION_2_MENS')
      OR upper(replace("name", '''', '')) IN ('D2', 'DIVISION 2', 'DIVISION 2 MENS')
    )
);

INSERT INTO "ClubMember" (
  "id",
  "vlyNumber",
  "name",
  "active",
  "rosterRole",
  "trainingTeamKey",
  "createdAt",
  "updatedAt"
)
SELECT
  'cm_lorin_bagayan',
  'VLY81022',
  'Lorin Bagayan',
  1,
  'PLAYER',
  (
    SELECT "key" FROM "TrainingSquad"
    WHERE "active" = 1
      AND (
        "key" = 'DIV3_WOMENS'
        OR upper("key") IN ('D3W', 'DIV3_WOMENS', 'DIVISION_3_WOMENS')
        OR upper(replace("name", '''', '')) IN ('D3W', 'DIVISION 3 WOMENS', 'DIVISION 3 WOMEN')
      )
    ORDER BY CASE "key" WHEN 'DIV3_WOMENS' THEN 0 WHEN 'D3W' THEN 1 ELSE 2 END, "sortOrder"
    LIMIT 1
  ),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "ClubMember" WHERE lower(trim("name")) = 'lorin bagayan'
)
AND NOT EXISTS (
  SELECT 1 FROM "ClubMember" WHERE "vlyNumber" = 'VLY81022'
)
AND EXISTS (
  SELECT 1 FROM "TrainingSquad"
  WHERE "active" = 1
    AND (
      "key" = 'DIV3_WOMENS'
      OR upper("key") IN ('D3W', 'DIV3_WOMENS', 'DIVISION_3_WOMENS')
      OR upper(replace("name", '''', '')) IN ('D3W', 'DIVISION 3 WOMENS', 'DIVISION 3 WOMEN')
    )
);

INSERT INTO "ClubTeamMember" (
  "id",
  "teamId",
  "clubMemberId",
  "name",
  "role",
  "isCaptain",
  "hidden",
  "sortOrder",
  "createdAt"
)
SELECT
  'ctm_' || m."id",
  t."id",
  m."id",
  m."name",
  'PLAYER',
  0,
  0,
  100,
  CURRENT_TIMESTAMP
FROM "ClubMember" m
JOIN "ClubTeam" t ON t."trainingTeamKey" = m."trainingTeamKey"
WHERE lower(trim(m."name")) IN ('nikita jaremkucks', 'lorin bagayan')
  AND NOT EXISTS (
    SELECT 1 FROM "ClubTeamMember" existing
    WHERE existing."teamId" = t."id"
      AND existing."clubMemberId" = m."id"
  );
