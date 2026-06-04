import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEventRatings1779600000002 implements MigrationInterface {
  name = 'CreateEventRatings1779600000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "event_ratings" (
        "id" SERIAL NOT NULL,
        "score" smallint NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "userId" integer,
        "eventId" integer,
        CONSTRAINT "PK_event_ratings" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_event_ratings_user_event" UNIQUE ("userId", "eventId")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "event_ratings"
        ADD CONSTRAINT "FK_event_ratings_user"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "event_ratings"
        ADD CONSTRAINT "FK_event_ratings_event"
        FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "event_ratings" DROP CONSTRAINT "FK_event_ratings_event"`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_ratings" DROP CONSTRAINT "FK_event_ratings_user"`,
    );
    await queryRunner.query(`DROP TABLE "event_ratings"`);
  }
}
