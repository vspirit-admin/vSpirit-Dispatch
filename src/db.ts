import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { SnakeNamingStrategy } from 'typeorm-naming-strategies'
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const GateabaseDataSource = new DataSource({
  type: 'better-sqlite3',
  database: __dirname + '/../database/gateabase.sqlite',
  entities: [__dirname + '/entities/**/*.{ts,js}'],
  synchronize: false,
  logging: false,
  namingStrategy: new SnakeNamingStrategy()
});
