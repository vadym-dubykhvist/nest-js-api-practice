import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRegistrations1779600000001 implements MigrationInterface {
  name = 'CreateRegistrations1779600000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "registrations" (
        "id" SERIAL NOT NULL,
        "email" character varying NOT NULL,
        "name" character varying NOT NULL,
        "additionalInfo" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "eventId" integer,
        "userId" integer,
        CONSTRAINT "PK_registrations" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "registrations"
        ADD CONSTRAINT "FK_registrations_event"
        FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "registrations"
        ADD CONSTRAINT "FK_registrations_user"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "registrations" DROP CONSTRAINT "FK_registrations_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "registrations" DROP CONSTRAINT "FK_registrations_event"`,
    );
    await queryRunner.query(`DROP TABLE "registrations"`);
  }
}
