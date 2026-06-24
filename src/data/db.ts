// 本地数据库配置。负责在浏览器中持久化存储账本数据

import Dexie, { type EntityTable } from "dexie";
import type {
  AppSettings,
  Category,
  EnvelopeAccount,
  Transaction
} from "../domain/types";
// 创建数据库以及数据库下的表
export const db = new Dexie("AccountBookLedger") as Dexie & {
  settings: EntityTable<AppSettings, "id">;
  envelopes: EntityTable<EnvelopeAccount, "id">;
  categories: EntityTable<Category, "id">;
  transactions: EntityTable<Transaction, "id">;
};

db.version(1).stores({
  settings: "id",
  envelopes: "id, name, sortOrder, archived",
  categories: "id, type, name, sortOrder, archived",
  transactions:
    "id, kind, occurredAt, categoryId, fromEnvelopeId, toEnvelopeId, createdAt"
});

db.version(2)
  .stores({
    settings: "id",
    envelopes: "id, name, sortOrder, archived",
    categories: "id, type, name, sortOrder, archived",
    transactions:
      "id, kind, occurredAt, categoryId, fromEnvelopeId, toEnvelopeId, createdAt"
  })
  .upgrade(async (transaction) => {
    // v2 resets v1 local data once to remove duplicated default seeds.
    await transaction.table("settings").clear();
    await transaction.table("envelopes").clear();
    await transaction.table("categories").clear();
    await transaction.table("transactions").clear();
  });
