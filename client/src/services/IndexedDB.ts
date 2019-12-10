import { openDB, IDBPDatabase, DBSchema } from "idb";
import { PaperPathBox, PaperPermissionType } from "../generated/graphql";

const DB_NAME = "Papeles";
enum DBStores {
  paper = "paper",
  path = "path"
}

export type PaperIndexedDB = {
  id: string;
  name: string;
  createdDate: Date;
  ownerId: string;
  permissions: { userId: string; type: PaperPermissionType }[];
  sequenceNumber: number;
};

export type PathIndexedDB = {
  key: string;
  paperId: string;
  box: PaperPathBox;
  data: string;
  id: number;
  device: string;
  userId: string;
  sequenceNumber?: number;
};

export type PathIdentifier = {
  paperId: string;
  id: number;
  device: string;
  userId: string;
};

interface MyDB extends DBSchema {
  [DBStores.paper]: {
    key: string;
    value: PaperIndexedDB;
  };
  [DBStores.path]: {
    key: string;
    value: PathIndexedDB;
    indexes: { "by-paper": string };
  };
}

export async function createIndexedDB() {
  const db = await openDB<MyDB>(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(DBStores.paper, {
        keyPath: "id",
        autoIncrement: false
      });

      const pathsStore = db.createObjectStore(DBStores.path, {
        keyPath: "key",
        autoIncrement: false
      });
      pathsStore.createIndex("by-paper", "paperId");
    }
  });
  return new IndexedDB(db);
}

export function sameKeys(path: PathIdentifier, path2: PathIdentifier) {
  return (
    `${path.paperId}-${path.id}-${path.userId}-${path.device}` ===
    `${path2.paperId}-${path2.id}-${path2.userId}-${path2.device}`
  );
}

export function getKeyFromPath(path: PathIdentifier) {
  return `${path.paperId}-${path.id}-${path.userId}-${path.device}`;
}

export class IndexedDB {
  constructor(private db: IDBPDatabase<MyDB>) {}

  getPaperPath(path: PathIdentifier) {
    return this.db.get(DBStores.path, getKeyFromPath(path));
  }

  fetchPapers() {
    return this.db.getAll(DBStores.paper);
  }

  loadPaperPaths(paperId: string) {
    return this.db.getAllFromIndex(DBStores.path, "by-paper", paperId);
  }

  async addPaths(paths: PathIndexedDB[]) {
    const tx = this.db.transaction(DBStores.path, "readwrite");
    for (const p of paths) {
      tx.store.add(p, getKeyFromPath(p));
    }
    await tx.done;
  }

  async updateUserId(userId: string) {
    const tx = this.db.transaction(DBStores.path, "readwrite");

    let cursor = await tx.store.openCursor();
    while (cursor) {
      if (cursor.value.userId === "undefined") {
        cursor.update({ ...cursor.value, userId });
      }
      cursor = await cursor.continue();
    }
    await tx.done;
  }

  deletePath(path: PathIdentifier) {
    return this.db.delete(DBStores.path, getKeyFromPath(path));
  }

  async updatePath(
    path: PathIdentifier & { box: PaperPathBox; sequenceNumber: number }
  ) {
    const key = getKeyFromPath(path);
    const tx = this.db.transaction(DBStores.path, "readwrite");
    const val = await tx.store.get(key);

    if (!val) {
      throw new Error();
    }
    tx.store.put({ ...val, ...path }, key);
    await tx.done;
  }
}
