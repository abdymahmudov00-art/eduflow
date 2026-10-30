import ProgressBar from "@/components/ui/progress-bar/ProgressBar";
import StatusBadge from "@/components/ui/status-badge/StatusBadge";
import type { Balance, Contract } from "@/lib/api/types";
import { formatDate, formatMoney, toNumber } from "@/lib/format";
import styles from "./balance-card.module.css";

interface BalanceCardProps {
  contract: Contract;
  balance?: Balance;
}

const BalanceCard = ({ contract, balance }: BalanceCardProps) => {
  const total = balance?.total_amount ?? toNumber(contract.total_amount);
  const paid = balance?.paid_amount ?? 0;
  const remaining = balance?.remaining_amount ?? total;
  const percent = total > 0 ? (paid / total) * 100 : 0;

  return (
    <article className={styles.card}>
      <div className={styles.top}>
        <div>
          <h3 className={styles.title}>Контракт №{contract.id}</h3>
          <span className={styles.meta}>с {formatDate(contract.start_date)}</span>
        </div>
        <StatusBadge kind="contract" status={contract.status} />
      </div>

      <div className={styles.amounts}>
        <div>
          <span className={styles.label}>Оплачено</span>
          <strong className={styles.paid}>{formatMoney(paid)}</strong>
        </div>
        <div className={styles.right}>
          <span className={styles.label}>Осталось</span>
          <strong className={styles.remaining}>{formatMoney(remaining)}</strong>
        </div>
      </div>

      <ProgressBar value={percent} label="Оплачено от суммы контракта" />

      <dl className={styles.details}>
        <div>
          <dt>Сумма контракта</dt>
          <dd>{formatMoney(total)}</dd>
        </div>
        <div>
          <dt>В месяц</dt>
          <dd>{formatMoney(contract.monthly_payment)}</dd>
        </div>
        <div>
          <dt>Оплачено месяцев</dt>
          <dd>
            {balance?.paid_months ?? 0} из {contract.duration_months}
          </dd>
        </div>
        {contract.payment_day && (
          <div>
            <dt>День оплаты</dt>
            <dd>до {contract.payment_day}-го числа</dd>
          </div>
        )}
      </dl>
    </article>
  );
};

export default BalanceCard;
