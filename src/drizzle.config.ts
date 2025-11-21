import * as fs from "node:fs";
import {defineConfig} from "drizzle-kit";
import 'dotenv/config';

// const ca = await fetchFile("https://letsencrypt.org/certs/isrgrootx1.pem")

export default defineConfig({
  dialect: 'mysql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    host: process.env.DB_HOST!,
    port: +(process.env.DB_PORT ?? 4000),
    user: process.env.DB_USER!,
    password: process.env.DB_PASS!,
    database: process.env.DB_NAME!,
    ssl: {
      ca: fs.readFileSync('./isrgrootx1.pem').toString(),
      // minVersion: 'TLSv1.2',
      rejectUnauthorized: true
    }
  },
  verbose: true,
  strict: true,
})
