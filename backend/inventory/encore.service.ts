import { Service } from "encore.dev/service";
import { SQLDatabase } from "encore.dev/storage/sqldb";

export default new Service("inventory");
export const inventoryDB = new SQLDatabase("inventory", { migrations: "./migrations" });
