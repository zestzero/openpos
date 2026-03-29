import { DataSource } from "typeorm";
import { authDB } from "./encore.service";
import { User } from "./user.entity";

let dataSource: DataSource | null = null;

export async function getDataSource(): Promise<DataSource> {
  if (dataSource && dataSource.isInitialized) return dataSource;
  dataSource = new DataSource({
    type: "postgres",
    url: authDB.connectionString,
    entities: [User],
    synchronize: false,
  });
  await dataSource.initialize();
  return dataSource;
}
