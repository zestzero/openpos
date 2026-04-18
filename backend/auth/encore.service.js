import { Service } from "encore.dev/service";
import { SQLDatabase } from "encore.dev/storage/sqldb";
export default new Service("auth");
export const authDB = new SQLDatabase("auth", {
    migrations: "./migrations",
});
//# sourceMappingURL=encore.service.js.map