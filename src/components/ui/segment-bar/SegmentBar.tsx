import styles from "./segment-bar.module.css";

export interface Segment {
  label: string;
  value: number;
  tone: "success" | "warning" | "danger" | "primary";
}

/** Полоска из цветных сегментов + легенда (как «решено / в работе») */
const SegmentBar = ({ segments }: { segments: Segment[] }) => {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  return (
    <div className={styles.wrapper}>
      <div className={styles.bar}>
        {total === 0 ? (
          <span className={styles.empty} />
        ) : (
          segments
            .filter((s) => s.value > 0)
            .map((s) => (
              <span key={s.label} className={`${styles.segment} ${styles[s.tone]}`} style={{ flexGrow: s.value }} />
            ))
        )}
      </div>
      <div className={styles.legend}>
        {segments.map((s) => (
          <span key={s.label} className={styles.item}>
            <span className={`${styles.dot} ${styles[s.tone]}`} />
            {s.label} {s.value}
          </span>
        ))}
      </div>
    </div>
  );
};

export default SegmentBar;
