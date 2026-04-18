import { DataSource } from "typeorm";
import { salesDB } from "./encore.service";
import { Order, OrderItem } from "./entities";
let dataSource = null;
export async function getDataSource() {
    if (dataSource && dataSource.isInitialized)
        return dataSource;
    dataSource = new DataSource({
        type: "postgres",
        url: salesDB.connectionString,
        entities: [Order, OrderItem],
        synchronize: false,
    });
    await dataSource.initialize();
    return dataSource;
}
//# sourceMappingURL=datasource.js.map