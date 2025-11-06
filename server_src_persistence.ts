import path from "path";
import { Level } from "level";
import fs from "fs";
import { mkdirpSync } from "fs-extra";

/**
 * This module prepares a LevelDB (y-leveldb) storage path for y-websocket persistence.
 * y-leveldb uses a directory per document; the server code simply ensures the base path exists.
 *
 * For demo/small deployments LevelDB persistence is fine. For multi-instance clusters,
 * look into a shared storage backend or using CRDT-aware replication.
 */

export async function openLevelDB(basePath: string) {
  const resolved = path.resolve(basePath);
  mkdirpSync(resolved);

  // Touch a simple db file so that persistence folder is created.
  const sentinel = path.join(resolved, ".init");
  if (!fs.existsSync(sentinel)) {
    fs.writeFileSync(sentinel, `initialized at ${new Date().toISOString()}`);
  }

  // We don't need to open any DB here; y-leveldb will open per-document stores.
  return resolved;
}