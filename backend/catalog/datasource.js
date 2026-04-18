import { DataSource } from "typeorm";
import { catalogDB } from "./encore.service";
import { Category, Product, Variant } from "./entities";
let dataSource = null;
export async function getDataSource() {
    if (dataSource && dataSource.isInitialized)
        return dataSource;
    dataSource = new DataSource({
        type: "postgres",
        url: catalogDB.connectionString,
        entities: [Category, Product, Variant],
        synchronize: false,
    });
    await dataSource.initialize();
    return dataSource;
}
//# sourceMappingURL=datasource.js.map