import { DataSource } from "typeorm";
import { inventoryDB } from "./encore.service";
import { InventoryLedger, InventorySnapshot } from "./entities";

let dataSource: DataSource | null = null;

export async function getDataSource(): Promise<DataSource> {
  if (dataSource && dataSource.isInitialized) return dataSource;

  dataSource = new DataSource({
    type: "postgres",
    url: inventoryDB.connectionString,
    entities: [InventoryLedger, InventorySnapshot],
    synchronize: false,
  });

  await dataSource.initialize();
  return dataSource;
}
