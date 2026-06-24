import type { LucideIcon } from "lucide-react";

export type TabKey = "dashboard" | "entry" | "allocation" | "records" | "stats" | "data";

interface BottomNavProps {
  tabs: Array<{
    key: TabKey;
    label: string;
    icon: LucideIcon;
  }>;
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
}

export function BottomNav({ tabs, activeTab, onChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="主导航">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            className={active ? "nav-item active" : "nav-item"}
            type="button"
            title={tab.label}
            aria-current={active ? "page" : undefined}
            onClick={() => onChange(tab.key)}
          >
            <Icon size={21} aria-hidden="true" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
