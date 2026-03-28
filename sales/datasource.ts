import { DataSource } from "typeorm";
import { salesDB } from "./encore.service";
import { Order, OrderItem } from "./entities";

let dataSource: DataSource | null = null;

export async function getDataSource(): Promise<DataSource> {
  if (dataSource && dataSource.isInitialized) return dataSource;

  dataSource = new DataSource({
    type: "postgres",
    url: salesDB.connectionString,
    entities: [Order, OrderItem],
    synchronize: false,
  });

  await dataSource.initialize();
  return dataSource;
}
