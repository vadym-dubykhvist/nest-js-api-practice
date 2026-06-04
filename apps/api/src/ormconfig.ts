import { DataSourceOptions } from 'typeorm';

const schema = process.env.DB_SCHEMA;

const config: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'nestjspractice',
  password: process.env.DB_PASSWORD ?? '18092002',
  database: process.env.DB_NAME ?? 'nestjspractice',
  schema,
  ...(schema && { extra: { options: `-c search_path=${schema}` } }),
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  dropSchema: process.env.DB_DROP_SCHEMA === 'true',
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
};

export default config;
