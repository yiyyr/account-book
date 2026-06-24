// 导入导出相关逻辑。

import type {
  AppSettings,
  Category,
  EnvelopeAccount,
  LedgerBackup,
  Transaction
} from "../domain/types";

const TRANSACTION_HEADERS = [
  "日期",
  "类型",
  "金额",
  "收入类目",
  "支出类目",
  "来源信封",
  "目标信封",
  "备注"
];

const KIND_LABELS: Record<Transaction["kind"], string> = {
  income: "收入",
  expense: "支出",
  allocation: "预算分配",
  transfer: "信封转账",
  adjustment: "余额调整"
};

export function serializeTransactionsCsv(
  transactions: Transaction[],
  categories: Category[],
  envelopes: EnvelopeAccount[]
) {
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const envelopeById = new Map(envelopes.map((envelope) => [envelope.id, envelope]));
  const rows = transactions.map((transaction) => {
    const category = transaction.categoryId
      ? categoryById.get(transaction.categoryId)
      : undefined;

    return [
      transaction.occurredAt.slice(0, 10),
      KIND_LABELS[transaction.kind],
      (transaction.amountCents / 100).toFixed(2),
      category?.type === "income" ? category.name : "",
      category?.type === "expense" ? category.name : "",
      transaction.fromEnvelopeId
        ? envelopeById.get(transaction.fromEnvelopeId)?.name ?? ""
        : "",
      transaction.toEnvelopeId
        ? envelopeById.get(transaction.toEnvelopeId)?.name ?? ""
        : "",
      transaction.note ?? ""
    ];
  });

  return [TRANSACTION_HEADERS, ...rows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\n");
}

export function parseBackupJson(json: string): LedgerBackup {
  const parsed = JSON.parse(json) as Partial<LedgerBackup>;

  if (parsed.schemaVersion !== 1) {
    throw new Error("备份版本不支持");
  }

  if (
    !isSettings(parsed.settings) ||
    !Array.isArray(parsed.envelopes) ||
    !Array.isArray(parsed.categories) ||
    !Array.isArray(parsed.transactions)
  ) {
    throw new Error("备份文件结构不正确");
  }

  return parsed as LedgerBackup;
}

export function downloadText(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function makeExportFilename(prefix: string, extension: string) {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}.${extension}`;
}

function escapeCsvCell(value: string) {
  const needsQuotes = /[",\n\r]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

function isSettings(value: unknown): value is AppSettings {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as AppSettings).id === "settings" &&
    typeof (value as AppSettings).currency === "string"
  );
}
