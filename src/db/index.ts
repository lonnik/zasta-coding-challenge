import { Pool, QueryResultRow } from "pg";
import { getPostgresConfig } from "./util";

export const pool = new Pool(getPostgresConfig());

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(1);
});

export const query = async <T extends QueryResultRow = any>(
  text: string,
  params?: any[]
) => {
  const start = Date.now();
  const result = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  console.log("executed query", { text, duration, rows: result.rowCount });
  return result;
};
