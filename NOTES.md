```markdown
Developer notes / how it works

1) WebSockets / CRDT flow
- Clients connect to the y-websocket endpoint at ws://<host>:1234
- Each document is a Y.Doc on the server and clients synchronize deltas via the y-websocket protocol.
- y-leveldb stores document update history on disk (one directory per document).

2) Auth
- For demo we provide /api/login that returns a signed JWT (no password).
- The token is sent as a query param to the WebSocket provider (in provider params).
- In production, use secure cookies or subprotocol level auth, TLS, and a trusted auth provider.

3) Extending
- Add Postgres to persist document metadata and user accounts.
- Replace LevelDB with a centralized store or shard strategy if you need multi-node active-active CRDT sync.
```