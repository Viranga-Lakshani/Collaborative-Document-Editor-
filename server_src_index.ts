import Fastify from "fastify";
import cors from "fastify-cors";
import jwt from "fastify-jwt";
import pino from "pino";
import { createServer } from "http";
import WebSocket from "ws";
import { setupWSConnection } from "y-websocket/bin/utils";
import path from "path";
import { openLevelDB } from "./persistence";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

const PORT = Number(process.env.PORT || 1234);
const JWT_SECRET = process.env.JWT_SECRET || "devsecret";
const LEVELDB_PATH = process.env.LEVELDB_PATH || path.join(__dirname, "../data/leveldb");

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

/**
 * Fastify app for HTTP endpoints: auth, doc listing, create doc, health.
 * The WebSocket server (y-websocket) runs on the same HTTP server and handles CRDT sync.
 */
async function buildServer() {
  const app = Fastify({ logger });
  app.register(cors, {
    origin: true,
    credentials: true,
  });

  app.register(jwt, {
    secret: JWT_SECRET,
  });

  // Simple "login" endpoint for demo — accepts { username } and returns a JWT.
  // Replace this with real auth (OAuth/SSO) in production.
  app.post("/api/login", async (req, reply) => {
    const body = req.body as any;
    const username = (body && body.username) || `guest-${Math.floor(Math.random() * 1000)}`;
    const user = { id: uuidv4(), name: username };
    const token = app.jwt.sign(user);
    return reply.send({ token, user });
  });

  // Create a new document: return id and metadata
  app.post("/api/docs", async (req, reply) => {
    try {
      const id = uuidv4();
      // In this demo we only return id. In prod persist doc metadata in Postgres.
      const doc = { id, title: (req.body as any).title || "Untitled document", createdAt: new Date().toISOString() };
      return reply.code(201).send(doc);
    } catch (err) {
      app.log.error(err);
      return reply.code(500).send({ error: "failed to create doc" });
    }
  });

  app.get("/api/docs", async (req, reply) => {
    // In a real app you'd query your DB for docs. Here we return example response.
    return reply.send([{ id: "example-doc", title: "Example document", createdAt: new Date().toISOString() }]);
  });

  app.get("/health", async () => ({ status: "ok", now: new Date().toISOString() }));

  return app;
}

/**
 * Wire up the Yjs websocket server.
 * We use y-websocket utilities to handle CRDT message routing.
 * This example uses y-leveldb for persistence on disk — suitable for single-node durable storage.
 * For multi-node active-active deployment you'd use a centralized persistence and/or replication layer.
 */
async function start() {
  // Ensure LevelDB opened so persistence files exist
  await openLevelDB(LEVELDB_PATH);

  const app = await buildServer();
  const server = createServer((req, res) => {
    // Fastify will handle HTTP; we attach it to the same server below.
    app.server.emit("request", req, res);
  });

  // WebSocket server for Yjs sync
  const wss = new WebSocket.Server({ noServer: true });

  // On upgrade, validate JWT (if provided in query) and then handle CRDT connection
  server.on("upgrade", (request, socket, head) => {
    // Optional: validate token in querystring, token=...
    // For demo we allow anonymous connections but in prod you must validate JWT
    wss.handleUpgrade(request, socket as any, head, (ws) => {
      // setupWSConnection expects (conn, req, { docName, gc })
      setupWSConnection(ws as any, request as any, { gc: true });
    });
  });

  // Attach fastify to the same server instance
  await app.listen({ port: PORT, host: "0.0.0.0", server });

  logger.info({ port: PORT }, "Server and WebSocket ready");
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});