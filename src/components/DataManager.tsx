import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import {
  Download,
  FileJson,
  FolderPlus,
  RefreshCcw,
  Trash2,
  Upload
} from "lucide-react";
import { ledgerRepository } from "../data/ledgerRepository";
import {
  downloadText,
  makeExportFilename,
  parseBackupJson,
  serializeTransactionsCsv
} from "../data/exportImport";
import type {
  AppSettings,
  Category,
  EnvelopeAccount,
  Transaction
} from "../domain/types";

interface DataManagerProps {
  settings: AppSettings;
  envelopes: EnvelopeAccount[];
  categories: Category[];
  transactions: Transaction[];
}

export function DataManager({
  settings,
  envelopes,
  categories,
  transactions
}: DataManagerProps) {
  const [currency, setCurrency] = useState(settings.currency);
  const [categoryName, setCategoryName] = useState("");
  const [categoryType, setCategoryType] = useState<"expense" | "income">("expense");
  const [categoryColor, setCategoryColor] = useState("#c2410c");
  const [status, setStatus] = useState("");

  useEffect(() => {
    setCurrency(settings.currency);
  }, [settings.currency]);

  async function handleExportJson() {
    const backup = await ledgerRepository.exportBackup();
    downloadText(
      makeExportFilename("account-book-backup", "json"),
      JSON.stringify(backup, null, 2),
      "application/json;charset=utf-8"
    );
    setStatus("JSON 已导出");
  }

  function handleExportCsv() {
    downloadText(
      makeExportFilename("account-book-transactions", "csv"),
      serializeTransactionsCsv(transactions, categories, envelopes),
      "text/csv;charset=utf-8"
    );
    setStatus("CSV 已导出");
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.currentTarget.value = "";

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const backup = parseBackupJson(text);
      if (!window.confirm("导入会替换当前账本数据。")) {
        return;
      }
      await ledgerRepository.replaceAll(backup);
      setStatus("JSON 已导入");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "导入失败");
    }
  }

  async function handleClear() {
    if (!window.confirm("确认清空当前账本？")) {
      return;
    }
    await ledgerRepository.clearAll();
    setStatus("已清空并恢复默认数据");
  }

  async function handleCurrency(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await ledgerRepository.updateCurrency(currency.trim() || "CNY");
    setStatus("币种已更新");
  }

  async function handleAddCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = categoryName.trim();

    if (!name) {
      setStatus("请输入类目名称");
      return;
    }

    try {
      await ledgerRepository.addCategory(name, categoryType, categoryColor);
      setCategoryName("");
      setStatus("类目已新增");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "新增类目失败");
    }
  }

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="section-heading">
          <h2>导出</h2>
          <Download size={22} aria-hidden="true" />
        </div>
        <div className="action-grid">
          <button className="secondary-button" type="button" onClick={handleExportJson}>
            <FileJson size={18} aria-hidden="true" />
            JSON
          </button>
          <button className="secondary-button" type="button" onClick={handleExportCsv}>
            <Download size={18} aria-hidden="true" />
            CSV
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>导入</h2>
          <Upload size={22} aria-hidden="true" />
        </div>
        <label className="file-button">
          <Upload size={18} aria-hidden="true" />
          JSON
          <input type="file" accept="application/json,.json" onChange={handleImport} />
        </label>
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>新增类目</h2>
          <FolderPlus size={22} aria-hidden="true" />
        </div>
        <form className="stacked-form" onSubmit={handleAddCategory}>
          <div className="segmented-control" role="tablist" aria-label="类目类型">
            <button
              type="button"
              className={categoryType === "expense" ? "active" : ""}
              onClick={() => {
                setCategoryType("expense");
                setCategoryColor("#c2410c");
              }}
            >
              支出
            </button>
            <button
              type="button"
              className={categoryType === "income" ? "active" : ""}
              onClick={() => {
                setCategoryType("income");
                setCategoryColor("#0f766e");
              }}
            >
              收入
            </button>
          </div>
          <label className="field">
            <span>名称</span>
            <input
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              maxLength={18}
            />
          </label>
          <div className="swatch-row" aria-label="类目颜色">
            {[
              "#0f766e",
              "#c2410c",
              "#2563eb",
              "#7c3aed",
              "#be123c",
              "#4d7c0f",
              "#a16207",
              "#475569"
            ].map((color) => (
              <button
                key={color}
                type="button"
                className={categoryColor === color ? "swatch active" : "swatch"}
                style={{ background: color }}
                title={color}
                aria-label={`选择颜色 ${color}`}
                onClick={() => setCategoryColor(color)}
              />
            ))}
          </div>
          <button className="secondary-button" type="submit">
            <FolderPlus size={18} aria-hidden="true" />
            新增
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>设置</h2>
          <RefreshCcw size={22} aria-hidden="true" />
        </div>
        <form className="inline-form" onSubmit={handleCurrency}>
          <label className="field">
            <span>币种</span>
            <input
              value={currency}
              onChange={(event) => setCurrency(event.target.value.toUpperCase())}
              maxLength={3}
            />
          </label>
          <button className="secondary-button" type="submit">
            保存
          </button>
        </form>
        <button className="danger-button" type="button" onClick={handleClear}>
          <Trash2 size={18} aria-hidden="true" />
          清空数据
        </button>
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>记录数</h2>
        </div>
        <dl className="count-grid">
          <div>
            <dt>信封</dt>
            <dd>{envelopes.length}</dd>
          </div>
          <div>
            <dt>类目</dt>
            <dd>{categories.length}</dd>
          </div>
          <div>
            <dt>账目</dt>
            <dd>{transactions.length}</dd>
          </div>
        </dl>
        {status && <p className="form-status">{status}</p>}
      </section>
    </div>
  );
}
