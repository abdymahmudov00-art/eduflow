import styles from "./progress-bar.module.css";

interface ProgressBarProps {
  /** 0–100 */
  value: number;
  label?: string;
}

const ProgressBar = ({ value, label }: ProgressBarProps) => {
  const percent = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div
      className={styles.track}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className={styles.fill} style={{ width: `${percent}%` }} />
    </div>
  );
};

export default ProgressBar;
