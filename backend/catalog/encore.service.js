import { Service } from "encore.dev/service";
import { SQLDatabase } from "encore.dev/storage/sqldb";
export const catalogDB = new SQLDatabase("catalog", {
    migrations: "./migrations",
});
export default new Service("catalog");
//# sourceMappingURL=encore.service.js.map