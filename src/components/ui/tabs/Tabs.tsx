import styles from "./tabs.module.css";

export interface TabItem<V extends string> {
  value: V;
  label: string;
  count?: number;
}

interface TabsProps<V extends string> {
  items: TabItem<V>[];
  value: V;
  onChange: (value: V) => void;
}

function Tabs<V extends string>({ items, value, onChange }: TabsProps<V>) {
  return (
    <div className={styles.tabs} role="tablist">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={item.value === value}
          className={`${styles.tab} ${item.value === value ? styles.active : ""}`}
          onClick={() => onChange(item.value)}
        >
          {item.label}
          {item.count !== undefined && <span className={styles.count}>{item.count}</span>}
        </button>
      ))}
    </div>
  );
}

export default Tabs;
