import Fastify from 'fastify'
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {FALLBACK_URL, REDIRECT_MAP} from "./config.js";
import {redirect_log} from "./db/schema.js";
import 'dotenv/config';
import {fetchFile} from "./utils.js";

const ca = await fetchFile("https://letsencrypt.org/certs/isrgrootx1.pem")

const poolConnection = mysql.createPool({
  host: process.env.DB_HOST,
  port: +(process.env.DB_PORT ?? 4000),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    ca: ca as string,
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  },
});
const db = drizzle({ client: poolConnection });

/*const result = await db.execute(`SELECT version()`)
console.log({result})
process.exit(0)*/

const fastify = Fastify({ logger: true })

// Declare a route
fastify.get('/', async function handler (req, res) {
  if (req.url === '/favicon.ico') {
    res.statusCode = 404;
    res.send();
    return;
  }
  const rawHost = req.headers.host ?? '';
  const hostname = rawHost.split(':')[0];
  const subdomain = hostname.split('.')[0];

  const protocol = req.headers['x-forwarded-proto'] ?? 'http';
  const sourceUrl = `${protocol}://${rawHost}${req.url}`;

  const ip = req.headers['x-forwarded-for'] ?? req.socket.remoteAddress;

  const targetUrl = REDIRECT_MAP[subdomain as keyof typeof REDIRECT_MAP] ?? FALLBACK_URL;

  res.redirect(targetUrl)

  console.log(`[REDIRECT] ${subdomain} -> ${targetUrl}`);

  const result_insert = await db.insert(redirect_log).values({
    source: sourceUrl,
    destin: targetUrl,
    ip: ip as string,
    headers: JSON.stringify(req.headers),
  });
  console.log(`[LOGGED] Inserted ID: ${result_insert[0].insertId}`);
})

fastify.listen({ port: +(process.env.PORT ?? 3000), host: process.env.HOST ?? '0.0.0.0', }, function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
  fastify.log.info(`server listening on ${address}`)
})
