import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventToArticles1779600000003 implements MigrationInterface {
  name = 'AddEventToArticles1779600000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "articles" ADD COLUMN "eventId" integer`,
    );
    await queryRunner.query(`
      ALTER TABLE "articles"
        ADD CONSTRAINT "FK_articles_event"
        FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "articles" DROP CONSTRAINT "FK_articles_event"`,
    );
    await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "eventId"`);
  }
}
