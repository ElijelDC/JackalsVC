-- Skills clinics: former SOCIAL events with clinic/workshop in title or description
UPDATE "Event"
SET type = 'SKILLS_CLINIC'
WHERE type = 'SOCIAL'
  AND (
    LOWER(title) LIKE '%clinic%'
    OR LOWER(title) LIKE '%workshop%'
    OR LOWER(COALESCE(description, '')) LIKE '%clinic%'
    OR LOWER(COALESCE(description, '')) LIKE '%workshop%'
  );

-- Social activities: former meetings
UPDATE "Event"
SET type = 'SOCIAL'
WHERE type = 'MEETING';
