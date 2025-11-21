import {mysqlTable, int, varchar, datetime, json} from "drizzle-orm/mysql-core"
import {REDIRECT_MAP} from "../config.js";
import {sql} from "drizzle-orm";

export const redirect_log = mysqlTable('redirect_log', {
  id: int().primaryKey().autoincrement(),
  create_datetime: datetime().notNull().default(sql`CURRENT_TIMESTAMP`),
  source: varchar({ length: 255, enum: Object.keys(REDIRECT_MAP) as [string, ...string[]], }).notNull(),
  destin: varchar({ length: 255, enum: Object.values(REDIRECT_MAP) as [string, ...string[]], }).notNull(),
  ip: varchar({ length: 255 }).notNull(),
  headers: json().notNull(),
});
