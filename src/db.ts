import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { SnakeNamingStrategy } from 'typeorm-naming-strategies'

export const GateabaseDataSource = new DataSource({
  type: 'sqlite',
  database: __dirname + '/../database/gateabase.sqlite',
  entities: [__dirname + '/entities/**/*.{ts,js}'],
  synchronize: false,
  logging: false,
  namingStrategy: new SnakeNamingStrategy()
});
