import { Service } from "encore.dev/service";
import { SQLDatabase } from "encore.dev/storage/sqldb";
export default new Service("sales");
export const salesDB = new SQLDatabase("sales", { migrations: "./migrations" });
//# sourceMappingURL=encore.service.js.map