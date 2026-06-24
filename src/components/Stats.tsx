import { useMemo, useState } from "react";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { ChartPie, TrendingUp } from "lucide-react";
import type {
  AppSettings,
  Category,
  EnvelopeAccount,
  Transaction
} from "../domain/types";
import { currentDateInputValue, getLastMonthKeys, getMonthKey } from "../domain/ledger";
import { formatMoney } from "../domain/money";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

interface StatsProps {
  settings: AppSettings;
  envelopes: EnvelopeAccount[];
  categories: Category[];
  transactions: Transaction[];
}

export function Stats({ settings, envelopes, categories, transactions }: StatsProps) {
  const [selectedMonth, setSelectedMonth] = useState(
    currentDateInputValue().slice(0, 7)
  );
  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );
  const envelopeById = useMemo(
    () => new Map(envelopes.map((envelope) => [envelope.id, envelope])),
    [envelopes]
  );

  const monthlyTransactions = useMemo(
    () =>
      transactions.filter(
        (transaction) => getMonthKey(transaction.occurredAt) === selectedMonth
      ),
    [selectedMonth, transactions]
  );

  const trendData = useMemo(() => {
    const keys = getLastMonthKeys(6);
    return {
      labels: keys,
      datasets: [
        {
          label: "收入",
          data: keys.map((key) =>
            sumTransactions(
              transactions.filter(
                (transaction) =>
                  transaction.kind === "income" &&
                  getMonthKey(transaction.occurredAt) === key
              )
            )
          ),
          backgroundColor: "#0f766e"
        },
        {
          label: "支出",
          data: keys.map((key) =>
            sumTransactions(
              transactions.filter(
                (transaction) =>
                  transaction.kind === "expense" &&
                  getMonthKey(transaction.occurredAt) === key
              )
            )
          ),
          backgroundColor: "#c2410c"
        }
      ]
    };
  }, [transactions]);

  const categoryRows = aggregateBy(
    monthlyTransactions.filter((transaction) => transaction.kind === "expense"),
    (transaction) => transaction.categoryId ?? "unknown"
  )
    .map(([categoryId, amountCents]) => ({
      label: categoryById.get(categoryId)?.name ?? "未分类",
      amountCents,
      color: categoryById.get(categoryId)?.color ?? "#475569"
    }))
    .sort((left, right) => right.amountCents - left.amountCents);

  const envelopeRows = aggregateBy(
    monthlyTransactions.filter((transaction) => transaction.kind === "expense"),
    (transaction) => transaction.fromEnvelopeId ?? "unknown"
  )
    .map(([envelopeId, amountCents]) => ({
      label: envelopeById.get(envelopeId)?.name ?? "未指定",
      amountCents,
      color: envelopeById.get(envelopeId)?.color ?? "#475569"
    }))
    .sort((left, right) => right.amountCents - left.amountCents);

  const categoryChartData = {
    labels: categoryRows.map((row) => row.label),
    datasets: [
      {
        data: categoryRows.map((row) => row.amountCents / 100),
        backgroundColor: categoryRows.map((row) => row.color),
        borderWidth: 0
      }
    ]
  };

  const envelopeChartData = {
    labels: envelopeRows.map((row) => row.label),
    datasets: [
      {
        label: "支出",
        data: envelopeRows.map((row) => row.amountCents / 100),
        backgroundColor: envelopeRows.map((row) => row.color)
      }
    ]
  };

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="section-heading">
          <h2>月份</h2>
          <TrendingUp size={22} aria-hidden="true" />
        </div>
        <label className="field compact-field">
          <span>月份</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
          />
        </label>
      </section>

      <section className="panel chart-panel">
        <div className="section-heading">
          <h2>月度趋势</h2>
        </div>
        <Bar
          data={trendData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: "bottom" } },
            scales: { y: { ticks: { callback: (value) => `${value}` } } }
          }}
        />
      </section>

      <section className="panel chart-panel">
        <div className="section-heading">
          <h2>类目占比</h2>
          <ChartPie size={22} aria-hidden="true" />
        </div>
        {categoryRows.length > 0 ? (
          <Doughnut
            data={categoryChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: "bottom" } }
            }}
          />
        ) : (
          <p className="muted-line">暂无支出</p>
        )}
      </section>

      <section className="panel chart-panel">
        <div className="section-heading">
          <h2>信封消耗</h2>
        </div>
        {envelopeRows.length > 0 ? (
          <Bar
            data={envelopeChartData}
            options={{
              indexAxis: "y",
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (item) =>
                      formatMoney(Number(item.raw) * 100, settings.currency)
                  }
                }
              }
            }}
          />
        ) : (
          <p className="muted-line">暂无支出</p>
        )}
      </section>
    </div>
  );
}

function aggregateBy(
  transactions: Transaction[],
  getKey: (transaction: Transaction) => string
) {
  const aggregate = new Map<string, number>();
  for (const transaction of transactions) {
    const key = getKey(transaction);
    aggregate.set(key, (aggregate.get(key) ?? 0) + transaction.amountCents);
  }
  return Array.from(aggregate.entries());
}

function sumTransactions(transactions: Transaction[]) {
  return (
    transactions.reduce((sum, transaction) => sum + transaction.amountCents, 0) /
    100
  );
}
