import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CalendarSearch,
  Pencil,
  ReceiptText,
  Save,
  Trash2,
  X
} from "lucide-react";
import { ledgerRepository } from "../data/ledgerRepository";
import {
  centsToInput,
  formatMoney,
  formatSignedMoney,
  parseMoneyToCents
} from "../domain/money";
import type {
  AppSettings,
  Category,
  EnvelopeAccount,
  Transaction
} from "../domain/types";

type RecordKindFilter = "all" | "income" | "expense";
type EditableTransaction = Transaction & { kind: "income" | "expense" };
const RECORDS_PAGE_SIZE = 50;

interface TransactionDateGroup {
  dateKey: string;
  weekdayLabel: string;
  incomeCents: number;
  expenseCents: number;
  transactions: EditableTransaction[];
}

interface RecordsProps {
  settings: AppSettings;
  envelopes: EnvelopeAccount[];
  categories: Category[];
  transactions: Transaction[];
}

interface EditFormState {
  amount: string;
  date: string;
  categoryId: string;
  envelopeId: string;
  note: string;
}

export function Records({
  settings,
  envelopes,
  categories,
  transactions
}: RecordsProps) {
  const now = new Date();
  const currentYear = String(now.getFullYear());
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
  const [kindFilter, setKindFilter] = useState<RecordKindFilter>("all");
  const [yearFilter, setYearFilter] = useState(currentYear);
  const [monthFilter, setMonthFilter] = useState(currentMonth);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(RECORDS_PAGE_SIZE);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [status, setStatus] = useState("");

  const editableTransactions = useMemo(
    () => transactions.filter(isEditableTransaction),
    [transactions]
  );
  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );
  const envelopeById = useMemo(
    () => new Map(envelopes.map((envelope) => [envelope.id, envelope])),
    [envelopes]
  );

  const yearOptions = useMemo(() => {
    const years = new Set(
      editableTransactions.map((transaction) =>
        String(new Date(transaction.occurredAt).getFullYear())
      )
    );
    years.add(currentYear);
    return Array.from(years).sort((left, right) => Number(right) - Number(left));
  }, [currentYear, editableTransactions]);

  const categoryOptions = useMemo(
    () =>
      categories.filter(
        (category) => kindFilter === "all" || category.type === kindFilter
      ),
    [categories, kindFilter]
  );

  const filteredTransactions = useMemo(
    () =>
      editableTransactions.filter((transaction) => {
        const occurredAt = new Date(transaction.occurredAt);
        const yearMatches = String(occurredAt.getFullYear()) === yearFilter;
        const monthMatches =
          monthFilter === "all" ||
          String(occurredAt.getMonth() + 1).padStart(2, "0") === monthFilter;
        const kindMatches =
          kindFilter === "all" || transaction.kind === kindFilter;
        const categoryMatches =
          categoryFilter === "all" || transaction.categoryId === categoryFilter;

        return yearMatches && monthMatches && kindMatches && categoryMatches;
      }),
    [
      categoryFilter,
      editableTransactions,
      kindFilter,
      monthFilter,
      yearFilter
    ]
  );

  useEffect(() => {
    setVisibleCount(RECORDS_PAGE_SIZE);
  }, [categoryFilter, kindFilter, monthFilter, yearFilter]);

  const filteredIncomeCents = sumByKind(filteredTransactions, "income");
  const filteredExpenseCents = sumByKind(filteredTransactions, "expense");
  const groupedTransactions = groupTransactionsByDate(filteredTransactions);
  const visibleGroups = getVisibleGroups(groupedTransactions, visibleCount);
  const displayedCount = countGroupedTransactions(visibleGroups);
  const hasMoreTransactions = displayedCount < filteredTransactions.length;
  const editingTransaction =
    editingId === null
      ? undefined
      : editableTransactions.find((transaction) => transaction.id === editingId);

  function updateKindFilter(nextKind: RecordKindFilter) {
    setKindFilter(nextKind);
    setCategoryFilter("all");
  }

  function startEdit(transaction: EditableTransaction) {
    setStatus("");
    setEditingId(transaction.id);
    setEditForm({
      amount: centsToInput(transaction.amountCents),
      date: transaction.occurredAt.slice(0, 10),
      categoryId: transaction.categoryId ?? "",
      envelopeId: transaction.fromEnvelopeId ?? "",
      note: transaction.note ?? ""
    });
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingTransaction || !editForm) {
      return;
    }

    try {
      const amountCents = parseMoneyToCents(editForm.amount);
      if (!editForm.categoryId) {
        throw new Error("请选择类目");
      }
      if (editingTransaction.kind === "expense" && !editForm.envelopeId) {
        throw new Error("请选择来源信封");
      }

      await ledgerRepository.updateTransaction({
        ...editingTransaction,
        amountCents,
        occurredAt: new Date(`${editForm.date}T12:00:00`).toISOString(),
        categoryId: editForm.categoryId,
        fromEnvelopeId:
          editingTransaction.kind === "expense" ? editForm.envelopeId : undefined,
        toEnvelopeId: undefined,
        note: editForm.note.trim() || undefined
      });
      setEditingId(null);
      setEditForm(null);
      setStatus("记录已更新");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "更新失败");
    }
  }

  async function handleDelete(transaction: EditableTransaction) {
    const label = transaction.kind === "income" ? "收入" : "支出";
    if (!window.confirm(`确认删除这笔${label}记录？`)) {
      return;
    }

    await ledgerRepository.deleteTransaction(transaction.id);
    if (editingId === transaction.id) {
      setEditingId(null);
      setEditForm(null);
    }
    setStatus("记录已删除");
  }

  return (
    <div className="page-grid">
      <section className="records-summary-grid">
        <article className="metric-card metric-primary">
          <ReceiptText size={22} aria-hidden="true" />
          <span>记录数</span>
          <strong>{filteredTransactions.length}</strong>
        </article>
        <article className="metric-card">
          <span>收入合计</span>
          <strong>{formatMoney(filteredIncomeCents, settings.currency)}</strong>
        </article>
        <article className="metric-card">
          <span>支出合计</span>
          <strong>{formatMoney(filteredExpenseCents, settings.currency)}</strong>
        </article>
        <article className="metric-card">
          <span>净额</span>
          <strong>
            {formatSignedMoney(
              filteredIncomeCents - filteredExpenseCents,
              settings.currency
            )}
          </strong>
        </article>
      </section>

      <section className="panel records-filter-panel">
        <div className="section-heading">
          <h2>流水筛选</h2>
          <CalendarSearch size={22} aria-hidden="true" />
        </div>
        <div className="segmented-control three" role="tablist" aria-label="记录类型">
          <button
            type="button"
            className={kindFilter === "all" ? "active" : ""}
            onClick={() => updateKindFilter("all")}
          >
            全部
          </button>
          <button
            type="button"
            className={kindFilter === "income" ? "active" : ""}
            onClick={() => updateKindFilter("income")}
          >
            收入
          </button>
          <button
            type="button"
            className={kindFilter === "expense" ? "active" : ""}
            onClick={() => updateKindFilter("expense")}
          >
            支出
          </button>
        </div>
        <div className="filter-grid">
          <label className="field">
            <span>年份</span>
            <select
              value={yearFilter}
              onChange={(event) => setYearFilter(event.target.value)}
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>月份</span>
            <select
              value={monthFilter}
              onChange={(event) => setMonthFilter(event.target.value)}
            >
              <option value="all">全年</option>
              {Array.from({ length: 12 }, (_, index) => {
                const value = String(index + 1).padStart(2, "0");
                return (
                  <option key={value} value={value}>
                    {index + 1} 月
                  </option>
                );
              })}
            </select>
          </label>
          <label className="field">
            <span>类目</span>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="all">全部类目</option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {editingTransaction && editForm && (
        <section className="panel records-editor">
          <div className="section-heading">
            <h2>编辑记录</h2>
            <button
              className="icon-only-button"
              type="button"
              title="取消编辑"
              onClick={() => {
                setEditingId(null);
                setEditForm(null);
              }}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          <form className="stacked-form" onSubmit={handleSave}>
            <label className="field">
              <span>金额</span>
              <input
                inputMode="decimal"
                value={editForm.amount}
                onChange={(event) =>
                  setEditForm({ ...editForm, amount: event.target.value })
                }
              />
            </label>
            <label className="field">
              <span>日期</span>
              <input
                type="date"
                value={editForm.date}
                onChange={(event) =>
                  setEditForm({ ...editForm, date: event.target.value })
                }
              />
            </label>
            <label className="field">
              <span>类目</span>
              <select
                value={editForm.categoryId}
                onChange={(event) =>
                  setEditForm({ ...editForm, categoryId: event.target.value })
                }
              >
                <option value="">选择类目</option>
                {categories
                  .filter((category) => category.type === editingTransaction.kind)
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </label>
            {editingTransaction.kind === "expense" && (
              <label className="field">
                <span>来源信封</span>
                <select
                  value={editForm.envelopeId}
                  onChange={(event) =>
                    setEditForm({ ...editForm, envelopeId: event.target.value })
                  }
                >
                  <option value="">选择信封</option>
                  {envelopes.map((envelope) => (
                    <option key={envelope.id} value={envelope.id}>
                      {envelope.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="field">
              <span>备注</span>
              <textarea
                rows={3}
                value={editForm.note}
                onChange={(event) =>
                  setEditForm({ ...editForm, note: event.target.value })
                }
              />
            </label>
            <button className="primary-button" type="submit">
              <Save size={18} aria-hidden="true" />
              保存修改
            </button>
          </form>
        </section>
      )}

      <section className="panel records-list-panel">
        <div className="section-heading">
          <h2>收入支出记录</h2>
        </div>
        <div className="transaction-list">
          {filteredTransactions.length === 0 && (
            <p className="muted-line">暂无匹配记录</p>
          )}
          {visibleGroups.map((group) => {
            const hasIncome = group.incomeCents > 0;
            const hasExpense = group.expenseCents > 0;
            const netCents = group.incomeCents - group.expenseCents;

            return (
              <section className="record-day-group" key={group.dateKey}>
                <header className="record-day-header">
                  <div className="record-day-title">
                    <strong>{group.dateKey}</strong>
                    <span>{group.weekdayLabel}</span>
                  </div>
                  <span className="record-day-count">
                    {group.transactions.length} 笔
                  </span>
                </header>
                <div className="record-day-metrics">
                  {hasExpense && (
                    <span>
                      支出 {formatMoney(group.expenseCents, settings.currency)}
                    </span>
                  )}
                  {hasIncome && (
                    <span>
                      收入 {formatMoney(group.incomeCents, settings.currency)}
                    </span>
                  )}
                  {hasIncome && hasExpense && (
                    <span
                      className={
                        netCents < 0 ? "amount-negative" : "amount-positive"
                      }
                    >
                      {netCents > 0 ? "净流入" : netCents < 0 ? "净流出" : "净额"}{" "}
                      {formatMoney(Math.abs(netCents), settings.currency)}
                    </span>
                  )}
                </div>
                {group.transactions.map((transaction) => {
                  const category = transaction.categoryId
                    ? categoryById.get(transaction.categoryId)
                    : undefined;
                  const envelope = transaction.fromEnvelopeId
                    ? envelopeById.get(transaction.fromEnvelopeId)
                    : undefined;
                  const signedAmount =
                    transaction.kind === "expense"
                      ? -transaction.amountCents
                      : transaction.amountCents;

                  return (
                    <article className="record-item" key={transaction.id}>
                      <div className="record-main">
                        <span className="transaction-title">
                          {category?.name ?? "未分类"}
                        </span>
                        <span className="transaction-date">
                          {transaction.kind === "income" ? "收入" : "支出"}
                          {envelope ? ` · ${envelope.name}` : ""}
                          {transaction.note ? ` · ${transaction.note}` : ""}
                        </span>
                      </div>
                      <strong
                        className={
                          transaction.kind === "expense"
                            ? "amount-negative"
                            : "amount-positive"
                        }
                      >
                        {formatSignedMoney(signedAmount, settings.currency)}
                      </strong>
                      <div className="record-actions">
                        <button
                          className="icon-only-button"
                          type="button"
                          title="编辑"
                          onClick={() => startEdit(transaction)}
                        >
                          <Pencil size={17} aria-hidden="true" />
                        </button>
                        <button
                          className="icon-only-button danger"
                          type="button"
                          title="删除"
                          onClick={() => void handleDelete(transaction)}
                        >
                          <Trash2 size={17} aria-hidden="true" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </section>
            );
          })}
          {filteredTransactions.length > 0 && (
            <div className="records-load-more-row">
              <span className="muted-line">
                已显示 {displayedCount} / {filteredTransactions.length} 条
              </span>
              {hasMoreTransactions && (
                <button
                  className="secondary-button records-load-more"
                  type="button"
                  onClick={() =>
                    setVisibleCount((count) => count + RECORDS_PAGE_SIZE)
                  }
                >
                  显示更多
                </button>
              )}
            </div>
          )}
        </div>
        {status && <p className="form-status">{status}</p>}
      </section>
    </div>
  );
}

function isEditableTransaction(
  transaction: Transaction
): transaction is EditableTransaction {
  return transaction.kind === "income" || transaction.kind === "expense";
}

function sumByKind(
  transactions: EditableTransaction[],
  kind: EditableTransaction["kind"]
) {
  return transactions
    .filter((transaction) => transaction.kind === kind)
    .reduce((sum, transaction) => sum + transaction.amountCents, 0);
}

function groupTransactionsByDate(transactions: EditableTransaction[]) {
  const groups = new Map<string, TransactionDateGroup>();

  for (const transaction of transactions) {
    const dateKey = transaction.occurredAt.slice(0, 10);
    const group =
      groups.get(dateKey) ??
      {
        dateKey,
        weekdayLabel: getWeekdayLabel(dateKey),
        incomeCents: 0,
        expenseCents: 0,
        transactions: []
      };

    if (transaction.kind === "income") {
      group.incomeCents += transaction.amountCents;
    } else {
      group.expenseCents += transaction.amountCents;
    }

    group.transactions.push(transaction);
    groups.set(dateKey, group);
  }

  return Array.from(groups.values());
}

function getVisibleGroups(
  groups: TransactionDateGroup[],
  minimumTransactionCount: number
) {
  const visibleGroups: TransactionDateGroup[] = [];
  let transactionCount = 0;

  for (const group of groups) {
    if (transactionCount >= minimumTransactionCount) {
      break;
    }

    visibleGroups.push(group);
    transactionCount += group.transactions.length;
  }

  return visibleGroups;
}

function countGroupedTransactions(groups: TransactionDateGroup[]) {
  return groups.reduce((sum, group) => sum + group.transactions.length, 0);
}

function getWeekdayLabel(dateKey: string) {
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return weekdays[new Date(`${dateKey}T12:00:00`).getDay()];
}
