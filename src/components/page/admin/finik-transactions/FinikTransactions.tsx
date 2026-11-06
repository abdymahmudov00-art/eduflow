"use client";

import { useState, type FormEvent } from "react";
import ActionMenu from "@/components/ui/action-menu/ActionMenu";
import Alert from "@/components/ui/alert/Alert";
import AsyncState from "@/components/ui/async-state/AsyncState";
import Badge, { type BadgeTone } from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Modal from "@/components/ui/modal/Modal";
import Table from "@/components/ui/table/Table";
import Tabs from "@/components/ui/tabs/Tabs";
import Textarea from "@/components/ui/textarea/Textarea";
import { FormActions, FormGrid, FullRow } from "@/components/ui/form-layout/FormLayout";
import { finikApi, finikStatus } from "@/lib/api";
import type { FinikTransaction } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";
import { useFetch } from "@/lib/hooks/useFetch";
import { finikStatusLabel } from "@/lib/labels";

type Filter = "all" | "attention" | "done";

const DONE = ["confirmed", "succeeded", "success", "paid", "rejected", "failed", "expired", "cancelled", "canceled"];
const OK = ["confirmed", "succeeded", "success", "paid"];
const BAD = ["rejected", "failed", "expired", "cancelled", "canceled"];

/** Транзакция требует внимания: не завершена или помечена бэкендом на проверку */
const needsAttention = (t: FinikTransaction) => Boolean(t.review_reason) || !DONE.includes(finikStatus(t.status));

function toneFor(t: FinikTransaction): BadgeTone {
  const s = finikStatus(t.status);
  if (OK.includes(s)) return "success";
  if (BAD.includes(s)) return "danger";
  if (t.review_reason) return "warning";
  return "info";
}

interface FinikTransactionsProps {
  /** Имя студента по номеру платежа (берётся из списка платежей на странице) */
  studentNameForPayment: (paymentId: number) => string;
  /** Что-то поменялось — обновить платежи на странице */
  onChanged: () => void;
}

/** Админ: онлайн-оплаты через Finik — статусы, повторная проверка, ручное решение спорных */
const FinikTransactions = ({ studentNameForPayment, onChanged }: FinikTransactionsProps) => {
  const { data, loading, error, reload } = useFetch(() => finikApi.transactions({ limit: 200 }));
  const [filter, setFilter] = useState<Filter>("attention");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [resolving, setResolving] = useState<{ tx: FinikTransaction; action: "confirm" | "reject" } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const all = [...(data ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const attention = all.filter(needsAttention);
  const done = all.filter((t) => !needsAttention(t));
  const rows = filter === "attention" ? attention : filter === "done" ? done : all;

  const handleRetry = async (tx: FinikTransaction) => {
    setBusyId(tx.id);
    setActionError(null);
    try {
      const fresh = await finikApi.retry(tx.id);
      setNotice(`Транзакция №${tx.id}: ${finikStatusLabel(fresh.status)}`);
      reload();
      onChanged();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Alert tone="info">
        Онлайн-оплаты подтверждаются автоматически, когда Finik сообщает серверу об оплате. Здесь — те, что ещё не
        завершены или требуют проверки. «Проверить снова» запрашивает статус у Finik; решение вручную — только
        если вы сверили оплату в кабинете Finik.
      </Alert>

      {(actionError || notice) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {actionError && <Alert onClose={() => setActionError(null)}>{actionError}</Alert>}
          {notice && (
            <Alert tone="success" onClose={() => setNotice(null)}>
              {notice}
            </Alert>
          )}
        </div>
      )}

      <AsyncState loading={loading} error={error} onRetry={reload}>
        <Tabs<Filter>
          value={filter}
          onChange={setFilter}
          items={[
            { value: "attention", label: "Требуют внимания", count: attention.length },
            { value: "done", label: "Завершённые", count: done.length },
            { value: "all", label: "Все", count: all.length },
          ]}
        />
        <Table<FinikTransaction>
          rows={rows}
          rowKey={(t) => t.id}
          emptyText={filter === "attention" ? "Всё в порядке — спорных оплат нет" : "Онлайн-оплат пока нет"}
          columns={[
            { key: "id", header: "№", width: 60, render: (t) => t.id },
            { key: "student", header: "Студент", render: (t) => <strong>{studentNameForPayment(t.payment_id)}</strong> },
            { key: "payment", header: "Платёж", render: (t) => `№${t.payment_id}` },
            { key: "created", header: "Создана", render: (t) => formatDateTime(t.created_at) },
            {
              key: "status",
              header: "Статус",
              render: (t) => (
                <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
                  <Badge tone={toneFor(t)}>{finikStatusLabel(t.status)}</Badge>
                  {t.review_reason && (
                    <span style={{ fontSize: 12, color: "var(--color-muted)" }}>{t.review_reason}</span>
                  )}
                  {t.admin_comment && (
                    <span style={{ fontSize: 12, color: "var(--color-muted)" }}>Комментарий: {t.admin_comment}</span>
                  )}
                </div>
              ),
            },
            {
              key: "actions",
              header: "",
              width: 56,
              align: "right",
              render: (t) => {
                const finished = DONE.includes(finikStatus(t.status)) && !t.review_reason;
                return (
                  <ActionMenu
                    items={[
                      {
                        label: "Проверить снова",
                        icon: "clock",
                        hidden: finished,
                        disabled: busyId === t.id,
                        onClick: () => handleRetry(t),
                      },
                      {
                        label: "Подтвердить вручную",
                        icon: "check",
                        hidden: finished,
                        onClick: () => setResolving({ tx: t, action: "confirm" }),
                      },
                      {
                        label: "Отклонить вручную",
                        icon: "close",
                        danger: true,
                        hidden: finished,
                        onClick: () => setResolving({ tx: t, action: "reject" }),
                      },
                      {
                        label: "Открыть ссылку оплаты",
                        icon: "arrowUpRight",
                        hidden: !t.payment_url,
                        onClick: () => window.open(t.payment_url ?? "", "_blank", "noopener"),
                      },
                    ]}
                  />
                );
              },
            },
          ]}
        />
      </AsyncState>

      <Modal
        open={resolving !== null}
        title={resolving?.action === "confirm" ? "Подтвердить оплату вручную" : "Отклонить оплату вручную"}
        onClose={() => setResolving(null)}
      >
        {resolving && (
          <ResolveForm
            tx={resolving.tx}
            action={resolving.action}
            onCancel={() => setResolving(null)}
            onDone={(message) => {
              setResolving(null);
              setNotice(message);
              reload();
              onChanged();
            }}
          />
        )}
      </Modal>
    </div>
  );
};

interface ResolveFormProps {
  tx: FinikTransaction;
  action: "confirm" | "reject";
  onCancel: () => void;
  onDone: (message: string) => void;
}

/** Ручное решение спорной операции: номер транзакции в Finik и комментарий */
const ResolveForm = ({ tx, action, onCancel, onDone }: ResolveFormProps) => {
  const [providerId, setProviderId] = useState(tx.provider_transaction_id ?? "");
  const [comment, setComment] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isConfirm = action === "confirm";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setServerError(null);
    try {
      await finikApi.resolve(tx.id, {
        action,
        provider_transaction_id: providerId.trim() || null,
        comment: comment.trim() || null,
      });
      onDone(isConfirm ? `Платёж №${tx.payment_id} подтверждён` : `Платёж №${tx.payment_id} отклонён`);
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Alert tone={isConfirm ? "info" : "error"}>
        {isConfirm
          ? "Подтверждайте, только если оплата видна в кабинете Finik. Платёж засчитается студенту."
          : "Платёж будет отклонён и не засчитается студенту."}
      </Alert>
      {serverError && (
        <div style={{ marginTop: 12 }}>
          <Alert>{serverError}</Alert>
        </div>
      )}
      <div style={{ marginTop: 16 }}>
        <FormGrid>
          <FullRow>
            <Input
              label="Номер транзакции в Finik"
              value={providerId}
              maxLength={150}
              hint="Необязательно, но помогает при сверке"
              onChange={(e) => setProviderId(e.target.value)}
            />
          </FullRow>
          <FullRow>
            <Textarea
              label="Комментарий"
              value={comment}
              maxLength={500}
              placeholder={isConfirm ? "Например: сверено с выпиской Finik" : "Причина отклонения"}
              onChange={(e) => setComment(e.target.value)}
            />
          </FullRow>
        </FormGrid>
      </div>
      <FormActions>
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Отмена
        </Button>
        <Button type="submit" variant={isConfirm ? "primary" : "danger"} loading={submitting}>
          {isConfirm ? "Подтвердить" : "Отклонить"}
        </Button>
      </FormActions>
    </form>
  );
};

export default FinikTransactions;
