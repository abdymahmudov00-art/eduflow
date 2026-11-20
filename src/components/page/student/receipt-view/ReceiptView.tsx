"use client";

import Alert from "@/components/ui/alert/Alert";
import AsyncState from "@/components/ui/async-state/AsyncState";
import Button from "@/components/ui/button/Button";
import Icon from "@/components/ui/icon/Icon";
import { finikApi } from "@/lib/api";
import type { FinikReceipt } from "@/lib/api/types";
import { formatDateTime, formatMoney, formatMonth, toNumber } from "@/lib/format";
import { useFetch } from "@/lib/hooks/useFetch";
import styles from "./receipt-view.module.css";

const SOURCE_LABELS: Record<string, string> = {
  webhook: "Уведомление от Finik",
  polling: "Проверка статуса в Finik",
  admin: "Подтверждено администратором",
  manual: "Подтверждено администратором",
};

/** Одна строка распределения из allocation_snapshot (формат свободный — берём что есть) */
function snapshotRow(row: Record<string, unknown>, i: number) {
  const month = typeof row.payment_month === "string" ? row.payment_month : null;
  const index = typeof row.period_index === "number" ? row.period_index : null;
  const label = month ? formatMonth(month) : index ? `Взнос ${index}` : `Часть ${i + 1}`;
  return { label, amount: toNumber(row.amount as string | number | undefined) };
}

/** Электронное подтверждение оплаты через Finik */
const ReceiptView = ({ paymentId, onClose }: { paymentId: number; onClose: () => void }) => {
  const { data, loading, error, reload } = useFetch(() => finikApi.receipt(paymentId));

  return (
    <AsyncState loading={loading} error={error} onRetry={reload}>
      {data && <ReceiptBody receipt={data} onClose={onClose} />}
    </AsyncState>
  );
};

const ReceiptBody = ({ receipt, onClose }: { receipt: FinikReceipt; onClose: () => void }) => {
  const rows = (receipt.allocation_snapshot ?? []).map(snapshotRow).filter((r) => r.amount > 0);
  const currency = receipt.currency?.toUpperCase() === "KGS" ? "" : ` ${receipt.currency}`;

  return (
    <div className={styles.receipt}>
      <div className={styles.top}>
        <span className={styles.badge}>
          <Icon name="check" size={26} />
        </span>
        <span className={styles.caption}>Оплата подтверждена</span>
        <strong className={styles.amount}>
          {formatMoney(receipt.amount)}
          {currency}
        </strong>
        <span className={styles.number}>Чек № {receipt.receipt_number}</span>
      </div>

      <dl className={styles.list}>
        <div>
          <dt>Подтверждено</dt>
          <dd>{formatDateTime(receipt.confirmed_at)}</dd>
        </div>
        {receipt.provider_paid_at && (
          <div>
            <dt>Оплачено в банке</dt>
            <dd>{formatDateTime(receipt.provider_paid_at)}</dd>
          </div>
        )}
        <div>
          <dt>Транзакция Finik</dt>
          <dd className={styles.mono}>{receipt.provider_transaction_id}</dd>
        </div>
        {receipt.provider_operation_id && (
          <div>
            <dt>Операция</dt>
            <dd className={styles.mono}>{receipt.provider_operation_id}</dd>
          </div>
        )}
        <div>
          <dt>Способ подтверждения</dt>
          <dd>{SOURCE_LABELS[receipt.verification_source?.toLowerCase()] ?? receipt.verification_source}</dd>
        </div>
        <div>
          <dt>Номер платежа</dt>
          <dd>№{receipt.payment_id}</dd>
        </div>
      </dl>

      {rows.length > 0 && (
        <div className={styles.alloc}>
          <span className={styles.allocTitle}>Засчитано</span>
          {rows.map((r, i) => (
            <div key={i} className={styles.allocRow}>
              <span>{r.label}</span>
              <strong>{formatMoney(r.amount)}</strong>
            </div>
          ))}
        </div>
      )}

      <Alert tone="info">Это электронное подтверждение. Его можно сохранить или распечатать.</Alert>

      <div className={styles.actions}>
        <Button variant="secondary" onClick={() => window.print()}>
          Распечатать
        </Button>
        <Button onClick={onClose}>Готово</Button>
      </div>
    </div>
  );
};

export default ReceiptView;
