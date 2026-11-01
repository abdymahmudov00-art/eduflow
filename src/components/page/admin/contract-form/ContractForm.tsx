"use client";

import { useState, type FormEvent } from "react";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import DateInput from "@/components/ui/date-input/DateInput";
import Combobox from "@/components/ui/combobox/Combobox";
import { FormActions, FormGrid, FullRow } from "@/components/ui/form-layout/FormLayout";
import type { Contract, ContractInput, Student } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/errors";
import { formatMoney, fullName, toNumber } from "@/lib/format";

interface ContractFormProps {
  contract?: Contract;
  students: Student[];
  onSubmit: (data: ContractInput) => Promise<void>;
  onCancel: () => void;
}

type Errors = Partial<Record<keyof ContractInput, string>>;

/** "90000.00" → "90000" для удобного редактирования */
function trimZeros(value: string | undefined) {
  if (!value) return "";
  return value.replace(/\.00$/, "");
}

const ContractForm = ({ contract, students, onSubmit, onCancel }: ContractFormProps) => {
  const [studentId, setStudentId] = useState(contract ? String(contract.student_id) : "");
  const [total, setTotal] = useState(trimZeros(contract?.total_amount));
  const [monthly, setMonthly] = useState(trimZeros(contract?.monthly_payment));
  const [duration, setDuration] = useState(contract ? String(contract.duration_months) : "");
  const [startDate, setStartDate] = useState(contract?.start_date ?? "");
  const [paymentDay, setPaymentDay] = useState(contract?.payment_day ? String(contract.payment_day) : "");
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const suggestedMonthly =
    toNumber(total) > 0 && toNumber(duration) > 0 ? toNumber(total) / toNumber(duration) : null;

  const validate = () => {
    const next: Errors = {};
    if (!studentId) next.student_id = "Выберите студента";
    if (!(toNumber(total) > 0)) next.total_amount = "Больше нуля";
    if (!(toNumber(monthly) > 0)) next.monthly_payment = "Больше нуля";
    const months = Number(duration);
    if (!Number.isInteger(months) || months <= 0) next.duration_months = "Целое число больше нуля";
    if (!startDate) next.start_date = "Укажите дату";
    if (paymentDay) {
      const day = Number(paymentDay);
      if (!Number.isInteger(day) || day < 1 || day > 28) next.payment_day = "Число от 1 до 28";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError(null);
    try {
      await onSubmit({
        student_id: Number(studentId),
        total_amount: total.replace(",", "."),
        monthly_payment: monthly.replace(",", "."),
        duration_months: Number(duration),
        start_date: startDate,
        payment_day: paymentDay ? Number(paymentDay) : null,
      });
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const studentOptions = students
    .map((s) => ({ value: String(s.id), label: fullName(s.personal_info), hint: s.student_number }))
    .sort((a, b) => a.label.localeCompare(b.label, "ru"));

  return (
    <form onSubmit={handleSubmit} noValidate>
      {serverError && (
        <div style={{ marginBottom: 16 }}>
          <Alert>{serverError}</Alert>
        </div>
      )}
      <FormGrid>
        <FullRow>
          <Combobox
            label="Студент"
            required
            placeholder="Введите имя, фамилию или номер студента"
            options={studentOptions}
            value={studentId}
            error={errors.student_id}
            onChange={setStudentId}
          />
        </FullRow>
        <Input
          label="Общая сумма"
          required
          inputMode="decimal"
          placeholder="90000"
          value={total}
          error={errors.total_amount}
          onChange={(e) => setTotal(e.target.value)}
        />
        <Input
          label="Срок, месяцев"
          required
          type="number"
          min={1}
          value={duration}
          error={errors.duration_months}
          onChange={(e) => setDuration(e.target.value)}
        />
        <Input
          label="Платёж в месяц"
          required
          inputMode="decimal"
          placeholder="15000"
          value={monthly}
          error={errors.monthly_payment}
          hint={suggestedMonthly ? `Сумма ÷ срок = ${formatMoney(suggestedMonthly)}` : undefined}
          onChange={(e) => setMonthly(e.target.value)}
        />
        <DateInput
          label="Дата начала"
          required
          value={startDate}
          error={errors.start_date}
          onChange={setStartDate}
        />
        <Input
          label="День оплаты"
          type="number"
          min={1}
          max={28}
          placeholder="Например, 12"
          value={paymentDay}
          error={errors.payment_day}
          hint="До какого числа платить каждый месяц"
          onChange={(e) => setPaymentDay(e.target.value)}
        />
      </FormGrid>
      <FormActions>
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Отмена
        </Button>
        <Button type="submit" loading={submitting}>
          {contract ? "Сохранить" : "Создать контракт"}
        </Button>
      </FormActions>
    </form>
  );
};

export default ContractForm;
