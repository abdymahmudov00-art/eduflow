"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Icon, { type IconName } from "@/components/ui/icon/Icon";
import Spinner from "@/components/ui/spinner/Spinner";
import { notificationsApi } from "@/lib/api";
import type { AppNotification } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";
import styles from "./notification-bell.module.css";

/** Как часто обновлять счётчик непрочитанных */
const POLL_MS = 60_000;

const TYPE_META: Record<string, { icon: IconName; tone: string }> = {
  payment_confirmed: { icon: "check", tone: styles.success },
  payment_due: { icon: "clock", tone: styles.warning },
  payment_overdue: { icon: "alert", tone: styles.danger },
  schedule_changed: { icon: "calendar", tone: styles.info },
};

/** Колокольчик в шапке: счётчик непрочитанных и выпадающий список уведомлений */
const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Если бэкенд не даёт уведомления этой роли — колокольчик просто не показываем
  const [available, setAvailable] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);

  const loadCount = useCallback(async () => {
    try {
      setCount(await notificationsApi.unreadCount());
    } catch {
      setAvailable(false);
    }
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await notificationsApi.list({ limit: 30 });
      list.sort((a, b) => b.created_at.localeCompare(a.created_at));
      setItems(list);
      setCount(list.filter((n) => !n.is_read).length);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Счётчик: сразу и потом раз в минуту, а также когда вкладка снова становится активной
  useEffect(() => {
    const first = setTimeout(loadCount, 0);
    const timer = setInterval(loadCount, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && loadCount();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadCount]);

  // Закрытие по клику вне панели и по Esc
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) loadList();
  };

  const markRead = async (n: AppNotification) => {
    if (n.is_read) return;
    setItems((prev) => prev?.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)) ?? prev);
    setCount((c) => Math.max(c - 1, 0));
    try {
      await notificationsApi.markRead(n.id);
    } catch {
      loadList();
    }
  };

  const markAll = async () => {
    setItems((prev) => prev?.map((x) => ({ ...x, is_read: true })) ?? prev);
    setCount(0);
    try {
      await notificationsApi.markAllRead();
    } catch (err) {
      setError(getErrorMessage(err));
      loadList();
    }
  };

  if (!available) return null;

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={`${styles.bell} ${open ? styles.bellOpen : ""}`}
        onClick={toggle}
        aria-label={count > 0 ? `Уведомления: ${count} непрочитанных` : "Уведомления"}
        aria-expanded={open}
      >
        <Icon name="bell" size={20} />
        {count > 0 && <span className={styles.count}>{count > 99 ? "99+" : count}</span>}
      </button>

      {open && (
        <div className={styles.panel} role="dialog" aria-label="Уведомления">
          <div className={styles.head}>
            <strong>Уведомления</strong>
            {count > 0 && (
              <button type="button" className={styles.readAll} onClick={markAll}>
                Прочитать все
              </button>
            )}
          </div>

          <div className={styles.list}>
            {loading && !items && (
              <div className={styles.state}>
                <Spinner />
              </div>
            )}
            {error && <p className={styles.error}>{error}</p>}
            {items && items.length === 0 && (
              <div className={styles.state}>
                <Icon name="bell" size={26} />
                Уведомлений пока нет
              </div>
            )}
            {items?.map((n) => {
              const meta = TYPE_META[n.type] ?? { icon: "info" as IconName, tone: styles.info };
              return (
                <button
                  key={n.id}
                  type="button"
                  className={`${styles.item} ${n.is_read ? "" : styles.unread}`}
                  onClick={() => markRead(n)}
                >
                  <span className={`${styles.icon} ${meta.tone}`}>
                    <Icon name={meta.icon} size={17} />
                  </span>
                  <span className={styles.body}>
                    <span className={styles.title}>{n.title}</span>
                    <span className={styles.message}>{n.message}</span>
                    <span className={styles.time}>{formatDateTime(n.created_at)}</span>
                  </span>
                  {!n.is_read && <span className={styles.dot} aria-label="Не прочитано" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
