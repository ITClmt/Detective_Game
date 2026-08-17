import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "../env";
import { relations } from "./relations";

export const pool = new Pool({
	connectionString: env.DATABASE_URL,
});

export const db = drizzle({ client: pool, relations });
