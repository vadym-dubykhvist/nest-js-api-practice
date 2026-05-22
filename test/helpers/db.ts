import { DataSource } from 'typeorm';

export async function cleanDatabase(dataSource: DataSource): Promise<void> {
  const tableNames = dataSource.entityMetadatas
    .map((meta) => `"${meta.tableName}"`)
    .join(', ');

  if (!tableNames) return;

  await dataSource.query(
    `TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`,
  );
}
