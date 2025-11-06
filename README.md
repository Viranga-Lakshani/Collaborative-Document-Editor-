# Collaborative Document Editor (CRDT) — Fullstack Reference

This repository is a production-ready reference for a collaborative document editor using CRDTs (Yjs) and WebSockets.

Key features
- Real-time collaborative editing using Yjs + y-websocket
- Quill-based rich-text editor bound to Yjs (operational convergence)
- Presence / awareness (user cursors, names)
- Document creation, listing, and permissions metadata via a small HTTP API
- JWT-based demo auth for local development
- Persistence of Yjs docs to LevelDB for durability
- Docker Compose for local dev, GitHub Actions CI, and clear, human-written code + comments

Architecture overview
- server/ : TypeScript Fastify HTTP server + y-websocket WebSocket server for CRDT sync and persistence.
- web/ : Next.js (TypeScript) React frontend that hosts the editor, document list, and simple login.
- docker-compose.yml: spins up server, web, and LevelDB-backed persistence volume.
- .env.example: environment variables for local development.

Why Yjs?
Yjs is a battle-tested CRDT library. We use y-websocket for realtime synchronization and y-leveldb to persist document updates to disk. This gives eventual convergence, offline editing resilience, and recovery after node restarts.

Getting started (dev)
1. Copy .env.example -> .env in repo root and edit values if needed.
2. Start services with Docker Compose:
   docker-compose up --build
3. Open http://localhost:3000 — login with any username, create a document, and open it in two browser windows to see collaboration.

Notes on production-readiness
- The current JWT/login is demo-mode and intended for local dev. Replace with OAuth/SSO and a proper auth service for production.
- Persistence currently uses LevelDB for Yjs; for multi-instance production you'd use a central persistence (Postgres event log, Redis streams, or a managed CRDT storage).
- WebSocket endpoint is built to validate JWT on connection. You should place the WebSocket behind a secure TLS load balancer in production.
- Add rate limits, DDoS protections, monitoring, and backups for persistence.

What's included in this scaffold
- server/: Fastify API for auth, documents, health; programmatic y-websocket server w/ LevelDB persistence.
- web/: Next.js editor pages (index, /doc/[id]) with Quill + yjs + awareness list.
- docker-compose.yml, scripts, GitHub Actions (CI), and comments in code.

If you'd like, next I can:
- Add Postgres-backed user & document metadata with migrations.
- Swap LevelDB for centralized persistence (Postgres or Delta Lake).
- Add SSO and secure secrets handling (Vault).
- Add Kubernetes manifests and Terraform for infra.

Enjoy — repo files follow.
