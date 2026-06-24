import { ArrowDownCircle, ArrowUpCircle, Plus, WalletCards } from "lucide-react";
import type {
  AppSettings,
  Category,
  EnvelopeAccount,
  LedgerSnapshot,
  Transaction
} from "../domain/types";
import { formatMoney, formatSignedMoney } from "../domain/money";

interface DashboardProps {
  settings: AppSettings;
  envelopes: EnvelopeAccount[];
  categories: Category[];
  transactions: Transaction[];
  snapshot: LedgerSnapshot;
  onQuickAdd: () => void;
}

export function Dashboard({
  settings,
  envelopes,
  categories,
  transactions,
  snapshot,
  onQuickAdd
}: DashboardProps) {
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const recentTransactions = transactions.slice(0, 6);
  const maxEnvelopeBalance = Math.max(
    1,
    ...envelopes.map((envelope) =>
      Math.max(0, snapshot.envelopeBalances[envelope.id] ?? 0)
    )
  );

  return (
    <div className="page-grid">
      <section className="summary-grid" aria-label="账本概览">
        <article className="metric-card metric-primary">
          <WalletCards size={22} aria-hidden="true" />
          <span>总余额</span>
          <strong>{formatMoney(snapshot.totalBalanceCents, settings.currency)}</strong>
        </article>
        <article className="metric-card">
          <ArrowUpCircle size={22} aria-hidden="true" />
          <span>本月收入</span>
          <strong>
            {formatMoney(snapshot.monthlyIncomeCents, settings.currency)}
          </strong>
        </article>
        <article className="metric-card">
          <ArrowDownCircle size={22} aria-hidden="true" />
          <span>本月支出</span>
          <strong>
            {formatMoney(snapshot.monthlyExpenseCents, settings.currency)}
          </strong>
        </article>
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>信封余额</h2>
          <button className="icon-text-button" type="button" onClick={onQuickAdd}>
            <Plus size={18} aria-hidden="true" />
            记一笔
          </button>
        </div>
        <div className="unallocated-row">
          <span>未分配资金</span>
          <strong>
            {formatMoney(snapshot.unallocatedCents, settings.currency)}
          </strong>
        </div>
        <div className="envelope-list">
          {envelopes.map((envelope) => {
            const balance = snapshot.envelopeBalances[envelope.id] ?? 0;
            const width = `${Math.max(
              4,
              Math.min(100, (Math.max(0, balance) / maxEnvelopeBalance) * 100)
            )}%`;

            return (
              <article className="envelope-card" key={envelope.id}>
                <div className="envelope-card-header">
                  <span className="color-dot" style={{ background: envelope.color }} />
                  <span>{envelope.name}</span>
                  <strong>{formatMoney(balance, settings.currency)}</strong>
                </div>
                <div className="balance-track" aria-hidden="true">
                  <span
                    className="balance-fill"
                    style={{ width, background: envelope.color }}
                  />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>最近记录</h2>
        </div>
        <div className="transaction-list">
          {recentTransactions.length === 0 && (
            <p className="muted-line">暂无账目</p>
          )}
          {recentTransactions.map((transaction) => {
            const isExpense = transaction.kind === "expense";
            const isIncome = transaction.kind === "income";
            const amount = isExpense
              ? -transaction.amountCents
              : transaction.amountCents;
            const category = transaction.categoryId
              ? categoryById.get(transaction.categoryId)
              : undefined;

            return (
              <article className="transaction-item" key={transaction.id}>
                <div>
                  <span className="transaction-title">
                    {category?.name ?? transactionLabel(transaction.kind)}
                  </span>
                  <span className="transaction-date">
                    {transaction.occurredAt.slice(0, 10)}
                  </span>
                </div>
                <strong className={isExpense ? "amount-negative" : "amount-positive"}>
                  {isIncome || isExpense
                    ? formatSignedMoney(amount, settings.currency)
                    : formatMoney(transaction.amountCents, settings.currency)}
                </strong>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function transactionLabel(kind: Transaction["kind"]) {
  const labels: Record<Transaction["kind"], string> = {
    income: "收入",
    expense: "支出",
    allocation: "分配",
    transfer: "转账",
    adjustment: "调整"
  };

  return labels[kind];
}
