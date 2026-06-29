import { useMemo, useState } from "react";
import {
  BarChart3,
  ClipboardList,
  Database,
  Home,
  Layers3,
  PlusCircle
} from "lucide-react";
import { BottomNav, type TabKey } from "./components/BottomNav";
import { Dashboard } from "./components/Dashboard";
import { QuickEntry } from "./components/QuickEntry";
import { Allocation } from "./components/Allocation";
import { Stats } from "./components/Stats";
import { DataManager } from "./components/DataManager";
import { Records } from "./components/Records";
import { useLedgerData } from "./hooks/useLedgerData";
import { calculateSnapshot } from "./domain/ledger";

const tabs = [
  { key: "dashboard", label: "首页", icon: Home },
  { key: "entry", label: "记账", icon: PlusCircle },
  { key: "allocation", label: "分配", icon: Layers3 },
  { key: "records", label: "流水", icon: ClipboardList },
  { key: "stats", label: "统计", icon: BarChart3 },
  { key: "data", label: "数据", icon: Database }
] satisfies Array<{ key: TabKey; label: string; icon: typeof Home }>;

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const { settings, envelopes, categories, transactions } = useLedgerData();
  const snapshot = useMemo(
    () => calculateSnapshot(envelopes, transactions),
    [envelopes, transactions]
  );

  const activeEnvelopes = envelopes.filter((envelope) => !envelope.archived);
  const activeCategories = categories.filter((category) => !category.archived);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Envelope Budget</p>
          <h1>个人账本</h1>
        </div>
        <div className="header-badge">{settings.currency}</div>
      </header>

      <main className="app-main">
        {activeTab === "dashboard" && (
          <Dashboard
            settings={settings}
            envelopes={activeEnvelopes}
            categories={activeCategories}
            transactions={transactions}
            snapshot={snapshot}
            onQuickAdd={() => setActiveTab("entry")}
          />
        )}
        {activeTab === "entry" && (
          <QuickEntry
            categories={activeCategories}
            envelopes={activeEnvelopes}
            onSaved={() => setActiveTab("dashboard")}
          />
        )}
        {activeTab === "allocation" && (
          <Allocation
            settings={settings}
            envelopes={activeEnvelopes}
            transactions={transactions}
            snapshot={snapshot}
          />
        )}
        {activeTab === "records" && (
          <Records
            settings={settings}
            envelopes={envelopes}
            categories={categories}
            transactions={transactions}
          />
        )}
        {activeTab === "stats" && (
          <Stats
            settings={settings}
            envelopes={activeEnvelopes}
            categories={activeCategories}
            transactions={transactions}
          />
        )}
        {activeTab === "data" && (
          <DataManager
            settings={settings}
            envelopes={envelopes}
            categories={categories}
            transactions={transactions}
          />
        )}
      </main>

      <BottomNav tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
}
