"use client";

import { useEffect, useRef, useState } from "react";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import Icon from "@/components/ui/icon/Icon";
import Spinner from "@/components/ui/spinner/Spinner";
import { finikApi, finikStatus } from "@/lib/api";
import type { FinikPayment } from "@/lib/api/types";
import { formatMoney } from "@/lib/format";
import styles from "./finik-checkout.module.css";

const POLL_MS = 3000;
/** Сколько ждём оплату, прежде чем предложить проверить позже */
const TIMEOUT_MS = 15 * 60 * 1000;

const PAID = ["confirmed", "succeeded", "success", "paid"];
const FAILED = ["rejected", "failed", "expired", "cancelled", "canceled"];

type Phase = "waiting" | "paid" | "failed" | "timeout";

interface FinikCheckoutProps {
  payment: FinikPayment;
  amount: string;
  /** Оплата прошла — обновить баланс на странице */
  onPaid: () => void;
  /** Закрыть окно (оплата может продолжиться — статус подтянется позже) */
  onClose: () => void;
  /** Попробовать ещё раз — вернуться к форме */
  onRetry: () => void;
}

/**
 * Экран онлайн-оплаты: ссылка на оплату Finik и ожидание подтверждения.
 * Подтверждение приходит на бэкенд от Finik (webhook), а мы раз в 3 секунды спрашиваем статус.
 */
const FinikCheckout = ({ payment, amount, onPaid, onClose, onRetry }: FinikCheckoutProps) => {
  const [phase, setPhase] = useState<Phase>(() => phaseOf(payment.status));
  const [url, setUrl] = useState(payment.payment_url ?? null);
  const onPaidRef = useRef(onPaid);
  onPaidRef.current = onPaid;

  useEffect(() => {
    if (phase !== "waiting") return;
    const started = Date.now();
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      try {
        const fresh = await finikApi.getPayment(payment.payment_id);
        if (stopped) return;
        if (fresh.payment_url) setUrl(fresh.payment_url);
        const next = phaseOf(fresh.status);
        if (next !== "waiting") {
          setPhase(next);
          if (next === "paid") onPaidRef.current();
          return;
        }
      } catch {
        // Сеть моргнула — просто попробуем ещё раз
      }
      if (Date.now() - started > TIMEOUT_MS) {
        setPhase("timeout");
        return;
      }
      timer = setTimeout(tick, POLL_MS);
    };
    timer = setTimeout(tick, POLL_MS);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [phase, payment.payment_id]);

  if (phase === "paid") {
    return (
      <div className={styles.result}>
        <span className={`${styles.badge} ${styles.ok}`}>
          <Icon name="check" size={30} />
        </span>
        <h3 className={styles.title}>Оплата прошла</h3>
        <p className={styles.text}>{formatMoney(amount)} зачислено. Баланс уже обновлён.</p>
        <Button fullWidth onClick={onClose}>
          Готово
        </Button>
      </div>
    );
  }

  if (phase === "failed") {
    return (
      <div className={styles.result}>
        <span className={`${styles.badge} ${styles.bad}`}>
          <Icon name="close" size={30} />
        </span>
        <h3 className={styles.title}>Оплата не прошла</h3>
        <p className={styles.text}>Деньги не списаны. Попробуйте ещё раз или выберите другой способ.</p>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose}>
            Закрыть
          </Button>
          <Button onClick={onRetry}>Попробовать снова</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.checkout}>
      <div className={styles.amount}>
        <span className={styles.label}>К оплате</span>
        <strong>{formatMoney(amount)}</strong>
      </div>

      {url ? (
        <>
          <a className={styles.payLink} href={url} target="_blank" rel="noopener noreferrer">
            <Icon name="wallet" size={20} />
            Открыть страницу оплаты
          </a>
          <p className={styles.hint}>
            Откроется страница Finik с QR-кодом. Отсканируйте его в приложении любого банка или, с телефона,
            выберите банк и подтвердите оплату.
          </p>
        </>
      ) : (
        <Alert tone="info">Ссылка на оплату ещё готовится…</Alert>
      )}

      {phase === "timeout" ? (
        <Alert tone="info">
          Пока не видим оплату. Если вы уже заплатили, статус обновится сам — проверьте страницу через несколько
          минут.
        </Alert>
      ) : (
        <Spinner label="Ждём подтверждения от банка…" />
      )}

      <Button variant="secondary" fullWidth onClick={onClose}>
        Закрыть — проверю позже
      </Button>
    </div>
  );
};

function phaseOf(status: string): Phase {
  const s = finikStatus(status);
  if (PAID.includes(s)) return "paid";
  if (FAILED.includes(s)) return "failed";
  return "waiting";
}

export default FinikCheckout;
