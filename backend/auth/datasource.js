import { DataSource } from "typeorm";
import { authDB } from "./encore.service";
import { User } from "./user.entity";
let dataSource = null;
export async function getDataSource() {
    if (dataSource && dataSource.isInitialized)
        return dataSource;
    dataSource = new DataSource({
        type: "postgres",
        url: authDB.connectionString,
        entities: [User],
        synchronize: false,
    });
    await dataSource.initialize();
    return dataSource;
}
//# sourceMappingURL=datasource.js.map