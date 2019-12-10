import { DBSchema, IDBPDatabase, openDB } from "idb";
import { PaperPathBox, PaperPathPoints } from "../generated/graphql";
import { SimplePermission, UNDEFINED_USER } from "./CanvasModel";
import { TOOLS_TYPES } from "./utils-canvas";

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
  permissions: SimplePermission[];
  sequenceNumber: number;
  currentTool: TOOLS_TYPES;
};

export type PathIndexedDB = {
  paperId: string;
  box: PaperPathBox;
  data: string;
  id: number;
  device: string;
  userId: string;
  sequenceNumber?: number;
  points?: PaperPathPoints;
};

type _PathIndexedDB = {
  key: string;
} & PathIndexedDB;

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
    value: _PathIndexedDB;
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
  return getKeyFromPath(path) === getKeyFromPath(path2);
}

export function getKeyFromPath(path: PathIdentifier) {
  return `${path.paperId}-${path.id}-${path.userId}-${path.device}`;
}

export function pathWithKey(path: PathIndexedDB): _PathIndexedDB {
  return Object.assign(path, { key: getKeyFromPath(path) });
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
    console.log(this.db, paths);
    const tx = this.db.transaction(DBStores.path, "readwrite");
    console.log(tx);
    for (const p of paths) {
      tx.store.add(pathWithKey(p));
    }
    return await tx.done;
  }

  async updateUserId(userId: string) {
    const tx = this.db.transaction(DBStores.path, "readwrite");

    let cursor = await tx.store.openCursor();
    while (cursor) {
      if (cursor.value.userId === UNDEFINED_USER) {
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
    path: PathIdentifier & { box?: PaperPathBox; sequenceNumber?: number }
  ) {
    const key = getKeyFromPath(path);
    const tx = this.db.transaction(DBStores.path, "readwrite");
    const val = await tx.store.get(key);

    if (!val) {
      throw new Error();
    }
    tx.store.put({ ...val, ...path });
    await tx.done;
  }

  async updatePaths(
    paths: Array<
      PathIdentifier & { box?: PaperPathBox; sequenceNumber?: number }
    >
  ) {
    const tx = this.db.transaction(DBStores.path, "readwrite");
    await Promise.all(
      paths.map(async path => {
        const key = getKeyFromPath(path);
        const val = await tx.store.get(key);

        if (!val) {
          throw new Error();
        }
        return tx.store.put({ ...val, ...path });
      })
    );
    return await tx.done;
  }

  updatePaper(value: PaperIndexedDB) {
    return this.db.put(DBStores.paper, value);
  }

  async deletePaper(paperId: string) {
    const tx = this.db.transaction(
      [DBStores.paper, DBStores.path],
      "readwrite"
    );
    tx.objectStore(DBStores.paper).delete(paperId);
    let cursor = await tx
      .objectStore(DBStores.path)
      .index("by-paper")
      .openCursor(paperId);
    while (cursor) {
      cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;
  }

  async deleteDB() {
    await Promise.all([
      this.db.clear(DBStores.paper),
      this.db.clear(DBStores.path)
    ]);
    this.db.close();
  }
}
