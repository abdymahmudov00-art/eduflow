"use client";

import { useState, type FormEvent } from "react";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import MonthInput from "@/components/ui/month-input/MonthInput";
import Select from "@/components/ui/select/Select";
import { FormActions, FormGrid, FullRow } from "@/components/ui/form-layout/FormLayout";
import { uuid4 } from "@/lib/api/payments";
import Tabs from "@/components/ui/tabs/Tabs";
import type { Balance, Contract, Payment, PaymentCreate } from "@/lib/api/types";
import { buildContractMonths, firstOpenMonth, monthBlockReason } from "@/lib/contract";
import { getErrorMessage, isFinalError } from "@/lib/errors";
import { currentMonth, formatMoney, toNumber } from "@/lib/format";
import { PAYMENT_METHODS } from "@/lib/labels";

/** online — оплата через Finik (QR / приложение банка), manual — сообщить о уже сделанной оплате */
export type PaymentMode = "online" | "manual";

interface PaymentFormProps {
  contracts: Contract[];
  balances: Balance[];
  /** Все платежи студента — по ним считаем, сколько осталось за каждый месяц */
  payments: Payment[];
  /** mode — как платит студент: онлайн через Finik или сообщает о сделанной оплате */
  onSubmit: (data: PaymentCreate, mode: PaymentMode) => Promise<void>;
  onCancel: () => void;
  /** Контракт, выбранный по умолчанию */
  defaultContractId?: number;
  /** Месяц по умолчанию ("YYYY-MM") */
  defaultMonth?: string;
}

/** "1500.00" → "1500", 1500.5 → "1500.5" */
const amountText = (n: number) => String(Math.round(n * 100) / 100);

const PaymentForm = ({
  contracts,
  balances,
  payments,
  onSubmit,
  onCancel,
  defaultContractId,
  defaultMonth,
}: PaymentFormProps) => {
  const monthsOf = (c: Contract | undefined) => (c ? buildContractMonths(c, payments) : []);

  const first = contracts.find((c) => c.id === defaultContractId) ?? contracts[0];
  const firstMonths = first?.type === "college" ? [] : monthsOf(first);
  const startMonth = defaultMonth ?? firstOpenMonth(firstMonths) ?? currentMonth();
  const startRemaining = firstMonths.find((m) => m.key === startMonth)?.remainingAmount;

  const [contractId, setContractId] = useState(first ? String(first.id) : "");
  const [month, setMonth] = useState(startMonth);
  const [amount, setAmount] = useState(
    startRemaining ? amountText(startRemaining) : first ? amountText(toNumber(first.monthly_payment)) : "",
  );
  const [mode, setMode] = useState<PaymentMode>("online");
  const [method, setMethod] = useState(PAYMENT_METHODS[0].value);
  const [errors, setErrors] = useState<{ contract?: string; amount?: string; month?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Один request_id на попытку: повтор после обрыва связи не создаст второй платёж
  const [requestId, setRequestId] = useState(uuid4);

  const contract = contracts.find((c) => String(c.id) === contractId);
  // «Колледж»: платежи идут в общий баланс, месяц не выбираем
  const isCollege = contract?.type === "college";
  const months = isCollege ? [] : monthsOf(contract);
  const monthInfo = months.find((m) => m.key === month);
  const blockReason = contract && !isCollege ? monthBlockReason(monthInfo) : null;
  const balance = balances.find((b) => String(b.contract_id) === contractId);
  const contractRemaining = balance ? toNumber(balance.remaining_amount) : undefined;

  /** При смене месяца/контракта подставляем остаток за месяц */
  const fillAmount = (nextMonths: typeof months, key: string) => {
    const info = nextMonths.find((m) => m.key === key);
    if (info && info.remainingAmount > 0) setAmount(amountText(info.remainingAmount));
  };

  const handleContractChange = (value: string) => {
    setContractId(value);
    const next = contracts.find((c) => String(c.id) === value);
    const nextMonths = next?.type === "college" ? [] : monthsOf(next);
    if (next?.type === "college") setAmount(amountText(toNumber(next.monthly_payment)));
    const key = firstOpenMonth(nextMonths) ?? month;
    setMonth(key);
    fillAmount(nextMonths, key);
    setErrors({});
  };

  const handleMonthChange = (key: string) => {
    setMonth(key);
    fillAmount(months, key);
    setErrors((prev) => ({ ...prev, month: undefined, amount: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next: typeof errors = {};
    if (!contractId) next.contract = "Выберите контракт";
    const value = toNumber(amount.replace(",", "."));
    if (!isCollege) {
      if (!/^\d{4}-\d{2}$/.test(month)) next.month = "Выберите месяц";
      else if (blockReason) next.month = blockReason;
    }
    if (!(value > 0)) next.amount = "Сумма должна быть больше нуля";
    else if (monthInfo && !blockReason && value > monthInfo.remainingAmount)
      next.amount = `За этот месяц можно внести не больше ${formatMoney(monthInfo.remainingAmount)}`;
    else if (contractRemaining !== undefined && value > contractRemaining)
      next.amount = "Больше, чем осталось оплатить по контракту";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    setServerError(null);
    try {
      await onSubmit(
        {
          request_id: requestId,
          contract_id: Number(contractId),
          amount: amount.replace(",", "."),
          payment_method: mode === "online" ? "finik" : method,
          payment_month: isCollege ? null : month,
        },
        mode,
      );
    } catch (err) {
      setServerError(getErrorMessage(err));
      // Сервер ответил отказом — следующая попытка будет новым платежом
      if (isFinalError(err)) setRequestId(uuid4());
    } finally {
      setSubmitting(false);
    }
  };

  if (contracts.length === 0) {
    return <Alert tone="info">У вас нет активных контрактов для оплаты.</Alert>;
  }

  const monthHint = monthInfo
    ? monthInfo.paidAmount > 0 || monthInfo.pendingAmount > 0
      ? `Оплачено ${formatMoney(monthInfo.paidAmount)}${
          monthInfo.pendingAmount > 0 ? `, на проверке ${formatMoney(monthInfo.pendingAmount)}` : ""
        } из ${formatMoney(monthInfo.dueAmount)}`
      : `К оплате за месяц: ${formatMoney(monthInfo.dueAmount)}`
    : undefined;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div style={{ marginBottom: 16 }}>
        <Tabs<PaymentMode>
          value={mode}
          onChange={(value) => {
            setMode(value);
            setServerError(null);
          }}
          items={[
            { value: "online", label: "Оплатить онлайн" },
            { value: "manual", label: "Уже оплатил(а)" },
          ]}
        />
        <p style={{ marginTop: 8, fontSize: 13, lineHeight: 1.5, color: "var(--color-muted)" }}>
          {mode === "online"
            ? "Оплата по QR-коду или через приложение банка (Finik). Подтвердится автоматически."
            : "Если вы уже заплатили наличными или переводом — администратор проверит и подтвердит."}
        </p>
      </div>
      {serverError && (
        <div style={{ marginBottom: 16 }}>
          <Alert>{serverError}</Alert>
        </div>
      )}
      <FormGrid>
        <FullRow>
          <Select
            label="Контракт"
            required
            options={contracts.map((c) => ({
              value: String(c.id),
              label: `Контракт №${c.id} · ${formatMoney(c.monthly_payment)}/мес`,
            }))}
            value={contractId}
            error={errors.contract}
            onChange={(e) => handleContractChange(e.target.value)}
            hint={contractRemaining !== undefined ? `Осталось по контракту: ${formatMoney(contractRemaining)}` : undefined}
          />
        </FullRow>
        {!isCollege && (
          <MonthInput
            label="За какой месяц"
            required
            value={month}
            error={errors.month ?? blockReason ?? undefined}
            hint={monthHint}
            onChange={handleMonthChange}
          />
        )}
        <Input
          label="Сумма"
          required
          inputMode="decimal"
          value={amount}
          error={errors.amount}
          hint={
            monthInfo && !blockReason
              ? monthInfo.remainingAmount < monthInfo.dueAmount
                ? `Остаток за месяц: ${formatMoney(monthInfo.remainingAmount)}`
                : "Можно оплатить частями"
              : undefined
          }
          onChange={(e) => {
            setAmount(e.target.value);
            setErrors((prev) => ({ ...prev, amount: undefined }));
          }}
        />
        {mode === "manual" && (
          <FullRow>
            <Select
              label="Способ оплаты"
              options={PAYMENT_METHODS}
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            />
          </FullRow>
        )}
      </FormGrid>
      <FormActions>
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Отмена
        </Button>
        <Button type="submit" loading={submitting} disabled={Boolean(blockReason)}>
          {mode === "online" ? "Перейти к оплате" : "Отправить на проверку"}
        </Button>
      </FormActions>
    </form>
  );
};

export default PaymentForm;
