export {};
// import { openDB, IDBPDatabase, DBSchema, IDBPCursorWithValue } from "idb";
// import {
//   PaperPathBox,
//   PaperPathData,
//   PaperPermissionType
// } from "../generated/graphql";
 
// enum DBStores {
//   papeles = "papeles",
//   paths = "paths"
// }

// export type PathIndexedDB = {
//   paperId: string;
//   box: PaperPathBox;
//   data: PaperPathData;
//   id: number;
//   device: string;
//   userId?: string;
//   sequenceNumber?: number;
// };

// export type PathIdentifier = {
//   paperId: string;
//   id: number;
//   device: string;
//   userId?: string;
// };

// export type PaperIndexedDB = {
//   id: string;
//   name: string;
//   createdDate: Date;
//   ownerId: string;
//   permissions: { userId: string; type: PaperPermissionType }[];
//   sequenceNumber: number;
// };

// export function haveSameId(
//   val: PathIdentifier,
//   path: PathIdentifier,
//   isMine: boolean
// ) {
//   return (
//     val.device === path.device &&
//     val.id === path.id &&
//     val.paperId === path.paperId &&
//     (val.userId === path.userId || (isMine && !val.userId))
//   );
// }

// interface MyDB extends DBSchema {
//   [DBStores.papeles]: {
//     key: string;
//     value: PaperIndexedDB;
//     indexes: { "by-id": string };
//   };
//   [DBStores.paths]: {
//     key: string;
//     value: PathIndexedDB;
//     indexes: { "by-paper": string; "by-id": number };
//   };
// }

// export async function createIndexedDB() {
//   const db = await openDB<MyDB>("Papeles", 1, {
//     upgrade(db) {
//       const papelesStore = db.createObjectStore(DBStores.papeles, {
//         keyPath: "id",
//         autoIncrement: false
//       });
//       papelesStore.createIndex("by-id", "id", { unique: true });

//       const pathsStore = db.createObjectStore(DBStores.paths, {
//         autoIncrement: false
//       });
//       pathsStore.createIndex("by-id", "id");
//       pathsStore.createIndex("by-paper", "paperId");
//     }
//   });
//   return new IndexedDB(db);
// }

// export class IndexedDB {
//   constructor(public db: IDBPDatabase<MyDB>) {}

//   async getPaperPath(path: PathIdentifier, isMine: boolean) {
//     return await this._findPathAndExecute(path, isMine);
//   }

//   async fetchPapers() {
//     return await this.db.getAll(DBStores.papeles);
//   }

//   async loadPaperPaths(paperId: string) {
//     return await this.db.getAllFromIndex(DBStores.paths, "by-paper", paperId);
//   }

//   async addPaths(paths: PathIndexedDB[]) {
//     const tx = this.db.transaction(DBStores.paths, "readwrite");
//     for (const p of paths) {
//       tx.store.add(p);
//     }
//     await tx.done;
//   }

//   async updateUserId(userId: string) {
//     const tx = this.db.transaction(DBStores.paths, "readwrite");

//     let cursor = await tx.store.openCursor();
//     while (cursor) {
//       if (!cursor.value.userId) {
//         cursor.update({ ...cursor.value, userId });
//       }
//       cursor = await cursor.continue();
//     }
//     await tx.done;
//   }

//   async deletePath(path: PathIdentifier, isMine: boolean) {
//     const found = await this._findPathAndExecute(path, isMine, cursor => {
//       cursor.delete();
//     });
//     return found;
//   }

//   async updatePath(
//     path: PathIdentifier & { box?: PaperPathBox; sequenceNumber?: number },
//     isMine: boolean
//   ) {
//     const found = await this._findPathAndExecute(path, isMine, cursor => {
//       cursor.update({ ...cursor.value, ...path });
//     });
//     return found;
//   }

//   async _findPathAndExecute(
//     path: PathIdentifier,
//     isMine: boolean,
//     callback?: (
//       cursor: IDBPCursorWithValue<
//         MyDB,
//         [DBStores.paths],
//         DBStores.paths,
//         "by-id"
//       >
//     ) => any
//   ) {
//     const tx = this.db.transaction(DBStores.paths, "readwrite");
//     const index = tx.store.index("by-id");
//     let cursor = await index.openCursor(path.id);
//     let found: PathIndexedDB | undefined = undefined;
//     while (cursor) {
//       const val = cursor.value;
//       if (haveSameId(val, path, isMine)) {
//         if (callback) callback(cursor);
//         found = cursor.value;
//         break;
//       }
//       cursor = await cursor.continue();
//     }
//     await tx.done;
//     return found;
//   }
// }
