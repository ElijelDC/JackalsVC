-- Migrate legacy signup status
UPDATE "EventSignup" SET "status" = 'ATTENDING' WHERE "status" = 'CONFIRMED';
