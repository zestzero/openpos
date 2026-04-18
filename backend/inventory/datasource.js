import { DataSource } from "typeorm";
import { inventoryDB } from "./encore.service";
import { InventoryLedger, InventorySnapshot } from "./entities";
let dataSource = null;
export async function getDataSource() {
    if (dataSource && dataSource.isInitialized)
        return dataSource;
    dataSource = new DataSource({
        type: "postgres",
        url: inventoryDB.connectionString,
        entities: [InventoryLedger, InventorySnapshot],
        synchronize: false,
    });
    await dataSource.initialize();
    return dataSource;
}
//# sourceMappingURL=datasource.js.map