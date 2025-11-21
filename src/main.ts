import * as http from 'node:http';
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {FALLBACK_URL, REDIRECT_MAP} from "@/config";
import {redirect_log} from "@/db/schema";
import 'dotenv/config';
import {fetchFile} from "@/utils";

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

const server = http.createServer(async (req, res) => {
    if (req.url === '/favicon.ico') {
        res.statusCode = 404;
        res.end();
        return;
    }

    try {
        const rawHost = req.headers.host ?? '';
        const hostname = rawHost.split(':')[0];
        const subdomain = hostname.split('.')[0];

        const protocol = req.headers['x-forwarded-proto'] ?? 'http';
        const sourceUrl = `${protocol}://${rawHost}${req.url}`;

        const ip = req.headers['x-forwarded-for'] ?? req.socket.remoteAddress;

        const targetUrl = REDIRECT_MAP[subdomain] ?? FALLBACK_URL;

        res.writeHead(302, {
            'Location': targetUrl,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Expires': '0'
        });
        res.end();

        console.log(`[REDIRECT] ${subdomain} -> ${targetUrl}`);

        const result_insert = await db.insert(redirect_log).values({
          source: sourceUrl,
          destin: targetUrl,
          ip: ip as string,
          headers: JSON.stringify(req.headers),
        });
        console.log(`[LOGGED] Inserted ID: ${result_insert[0].insertId}`);

    } catch (error) {
        console.error('Server Internal Error:', error);
        res.writeHead(500);
        res.end('Internal Server Error');
    }
});

process.on('SIGINT', async () => {
    console.log('\nClosing database connection...');
    process.exit(0);
});

const PORT = +(process.env.PORT ?? 80);
const HOSTNAME = process.env.HOSTNAME ?? "0.0.0.0";
server.listen(PORT, HOSTNAME, () => {
    console.log(`changwei.me Redirect Service running on port ${PORT}`);
});
