import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEvents1779600000000 implements MigrationInterface {
  name = 'CreateEvents1779600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "events" (
        "id" SERIAL NOT NULL,
        "title" character varying NOT NULL,
        "description" character varying NOT NULL DEFAULT '',
        "location" character varying NOT NULL DEFAULT '',
        "startDate" TIMESTAMP NOT NULL,
        "endDate" TIMESTAMP NOT NULL,
        "image" character varying NOT NULL DEFAULT '',
        "tags" text NOT NULL DEFAULT '',
        "registeredCount" integer NOT NULL DEFAULT 0,
        "maxGuests" integer NOT NULL DEFAULT 0,
        "rating" double precision NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "authorId" integer,
        CONSTRAINT "PK_events" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "events"
        ADD CONSTRAINT "FK_events_author"
        FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "events" DROP CONSTRAINT "FK_events_author"`,
    );
    await queryRunner.query(`DROP TABLE "events"`);
  }
}
