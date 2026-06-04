import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateComments1779500000000 implements MigrationInterface {
  name = 'CreateComments1779500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "comments" (
        "id" SERIAL NOT NULL,
        "body" character varying NOT NULL,
        "likesCount" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "authorId" integer,
        "articleId" integer,
        "parentId" integer,
        CONSTRAINT "PK_comments" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "comment_likes" (
        "commentId" integer NOT NULL,
        "userId" integer NOT NULL,
        CONSTRAINT "PK_comment_likes" PRIMARY KEY ("commentId", "userId")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_comment_likes_commentId" ON "comment_likes" ("commentId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_comment_likes_userId" ON "comment_likes" ("userId")`,
    );

    await queryRunner.query(`
      ALTER TABLE "comments"
        ADD CONSTRAINT "FK_comments_author"
        FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "comments"
        ADD CONSTRAINT "FK_comments_article"
        FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "comments"
        ADD CONSTRAINT "FK_comments_parent"
        FOREIGN KEY ("parentId") REFERENCES "comments"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "comment_likes"
        ADD CONSTRAINT "FK_comment_likes_comment"
        FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "comment_likes"
        ADD CONSTRAINT "FK_comment_likes_user"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "comment_likes" DROP CONSTRAINT "FK_comment_likes_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comment_likes" DROP CONSTRAINT "FK_comment_likes_comment"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" DROP CONSTRAINT "FK_comments_parent"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" DROP CONSTRAINT "FK_comments_article"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" DROP CONSTRAINT "FK_comments_author"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_comment_likes_userId"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_comment_likes_commentId"`,
    );
    await queryRunner.query(`DROP TABLE "comment_likes"`);
    await queryRunner.query(`DROP TABLE "comments"`);
  }
}
