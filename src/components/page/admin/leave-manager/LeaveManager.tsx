"use client";

import { useState, type FormEvent } from "react";
import Alert from "@/components/ui/alert/Alert";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import DateInput from "@/components/ui/date-input/DateInput";
import { FormActions, FormGrid, FormSection, FullRow } from "@/components/ui/form-layout/FormLayout";
import { contractsApi } from "@/lib/api";
import type { AcademicLeave, Contract } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import styles from "./leave-manager.module.css";

interface LeaveManagerProps {
  contract: Contract;
  onChanged: () => void;
}

/** Академические отпуска по контракту: оформить и отменить */
const LeaveManager = ({ contract, onChanged }: LeaveManagerProps) => {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<{ start?: string; end?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  // Действующие сверху, отменённые — ниже
  const leaves = [...(contract.academic_leaves ?? [])].sort(
    (a, b) => Number(Boolean(a.cancelled_at)) - Number(Boolean(b.cancelled_at)) || b.start_date.localeCompare(a.start_date),
  );

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next: typeof errors = {};
    if (!start) next.start = "Укажите дату";
    if (!end) next.end = "Укажите дату";
    else if (start && end < start) next.end = "Не раньше начала";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSubmitting(true);
    setError(null);
    try {
      await contractsApi.addLeave(contract.id, { start_date: start, end_date: end, reason: reason.trim() || null });
      setStart("");
      setEnd("");
      setReason("");
      onChanged();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (leave: AcademicLeave) => {
    setCancellingId(leave.id);
    setError(null);
    try {
      await contractsApi.cancelLeave(contract.id, leave.id);
      onChanged();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div>
      {error && <Alert onClose={() => setError(null)}>{error}</Alert>}

      {leaves.length === 0 ? (
        <p className={styles.empty}>Отпусков по этому контракту не было.</p>
      ) : (
        <ul className={styles.list}>
          {leaves.map((leave) => (
            <li key={leave.id} className={`${styles.item} ${leave.cancelled_at ? styles.cancelled : ""}`}>
              <div className={styles.text}>
                <strong>
                  {formatDate(leave.start_date)} — {formatDate(leave.end_date)}
                </strong>
                {leave.reason && <span className={styles.reason}>{leave.reason}</span>}
              </div>
              {leave.cancelled_at ? (
                <Badge>Отменён</Badge>
              ) : (
                <Button
                  variant="dangerOutline"
                  size="sm"
                  loading={cancellingId === leave.id}
                  onClick={() => handleCancel(leave)}
                >
                  Отменить
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} noValidate>
        <FormSection title="Оформить отпуск">
          <FormGrid>
            <DateInput label="С" required value={start} error={errors.start} onChange={setStart} />
            <DateInput label="По" required value={end} error={errors.end} onChange={setEnd} />
            <FullRow>
              <Input label="Причина" placeholder="По заявлению студента" value={reason} onChange={(e) => setReason(e.target.value)} />
            </FullRow>
          </FormGrid>
        </FormSection>
        <FormActions>
          <Button type="submit" loading={submitting}>
            Оформить отпуск
          </Button>
        </FormActions>
      </form>
    </div>
  );
};

export default LeaveManager;
