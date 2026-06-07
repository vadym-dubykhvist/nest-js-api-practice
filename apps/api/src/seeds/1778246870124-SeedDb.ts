import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedDb1778246870124 implements MigrationInterface {
  name = 'SeedDb1778246870124';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO tags (name) values ('dragons'), ('coffee'), ('nestjs')`,
    );

    await queryRunner.query(
      //Password: Test123
      `INSERT INTO users (username, email, password) values ('testusername', 'test@example.com', '$2b$10$VFiBrQMCamA.jELtxczPJ.kloEiysXhJNrF6.WtQUDkDlrm6f13/i')`,
    );

    await queryRunner.query(
      `INSERT INTO articles (title, slug, description, body, "tagList", "authorId") values ('First article', 'first-article-1d4g3', 'First article description', 'First article body', 'coffee,dragons', 1),
        ('Second article', 'second-article-2d4g3', 'Second article description', 'Second article body', 'nestjs,react', 1)`,
    );
  }

  public async down(): Promise<void> {}
}
