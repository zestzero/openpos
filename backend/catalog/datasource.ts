import { DataSource } from "typeorm";
import { catalogDB } from "./encore.service";
import { Category, Product, Variant } from "./entities";

let dataSource: DataSource | null = null;

export async function getDataSource(): Promise<DataSource> {
  if (dataSource && dataSource.isInitialized) return dataSource;
  dataSource = new DataSource({
    type: "postgres",
    url: catalogDB.connectionString,
    entities: [Category, Product, Variant],
    synchronize: false,
  });
  await dataSource.initialize();
  return dataSource;
}
