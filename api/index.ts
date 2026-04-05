import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { createPool } from "pg";
import router from "../artifacts/api-server/src/routes/index.js";

const PgStore = connectPgSimple(session);

const logger = pinoHttp({
  level: process.env.LOG_LEVEL ?? "info",
});

export default async function handler(req: any, res: any) {
  const app = express();

  app.use(logger);
  app.set("trust proxy", 1);
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // PostgreSQL pool from DATABASE_URL
  const pgPool = createPool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
  });

  app.use(
    session({
      store: new PgStore({ pool: pgPool, tableName: "sessoes", createTableIfMissing: true }),
      secret: process.env.SESSION_SECRET || "amelia-totem-secret-2025",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 8,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      },
    })
  );

  app.use("/api", router);

  // Return express handler to Vercel
  // @ts-ignore
  await new Promise<void>((resolve, reject) => {
    app(req, res, (err: any) => (err ? reject(err) : resolve()));
  });

  // Clean up pg pool after request
  await pgPool.end();
}
