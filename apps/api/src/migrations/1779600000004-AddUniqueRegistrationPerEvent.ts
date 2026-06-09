import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueRegistrationPerEvent1779600000004
  implements MigrationInterface
{
  name = 'AddUniqueRegistrationPerEvent1779600000004';

  // One registration per email per event, enforced at the database level. The
  // service still does a friendly pre-check; this index closes the TOCTOU race
  // where two concurrent requests both pass that check. The name matches the
  // @Index on RegistrationEntity so the dev DB (migrations) and the test DB
  // (synchronize) end up with the exact same index.
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make the data satisfiable before adding the constraint: drop duplicate
    // (eventId, email) rows (keep the earliest), then re-sync the denormalised
    // registeredCount. No-ops on a clean DB, so it's safe to run anywhere.
    await queryRunner.query(`
      DELETE FROM "registrations" a
        USING "registrations" b
        WHERE a.id > b.id
          AND a."eventId" = b."eventId"
          AND a."email" = b."email"
    `);
    await queryRunner.query(`
      UPDATE "events" e
        SET "registeredCount" =
          (SELECT COUNT(*) FROM "registrations" r WHERE r."eventId" = e.id)
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_registrations_event_email"
        ON "registrations" ("eventId", "email")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_registrations_event_email"`);
  }
}
