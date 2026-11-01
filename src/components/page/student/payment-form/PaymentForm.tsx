"use client";

import { useState, type FormEvent } from "react";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import MonthInput from "@/components/ui/month-input/MonthInput";
import Select from "@/components/ui/select/Select";
import { FormActions, FormGrid, FullRow } from "@/components/ui/form-layout/FormLayout";
import type { Balance, Contract, PaymentCreate } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/errors";
import { currentMonth, formatMoney, toNumber } from "@/lib/format";
import { PAYMENT_METHODS } from "@/lib/labels";

interface PaymentFormProps {
  contracts: Contract[];
  balances: Balance[];
  onSubmit: (data: PaymentCreate) => Promise<void>;
  onCancel: () => void;
  /** Контракт, выбранный по умолчанию */
  defaultContractId?: number;
  /** Месяц по умолчанию ("YYYY-MM") */
  defaultMonth?: string;
}

const PaymentForm = ({
  contracts,
  balances,
  onSubmit,
  onCancel,
  defaultContractId,
  defaultMonth,
}: PaymentFormProps) => {
  const first = contracts.find((c) => c.id === defaultContractId) ?? contracts[0];
  const [contractId, setContractId] = useState(first ? String(first.id) : "");
  const [amount, setAmount] = useState(first ? first.monthly_payment.replace(/\.00$/, "") : "");
  const [method, setMethod] = useState(PAYMENT_METHODS[0].value);
  const [month, setMonth] = useState(() => defaultMonth ?? currentMonth());
  const [errors, setErrors] = useState<{ contract?: string; amount?: string; month?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const contract = contracts.find((c) => String(c.id) === contractId);
  const balance = balances.find((b) => String(b.contract_id) === contractId);

  const handleContractChange = (value: string) => {
    setContractId(value);
    const next = contracts.find((c) => String(c.id) === value);
    if (next) setAmount(next.monthly_payment.replace(/\.00$/, ""));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next: typeof errors = {};
    if (!contractId) next.contract = "Выберите контракт";
    const value = toNumber(amount.replace(",", "."));
    if (!(value > 0)) next.amount = "Сумма должна быть больше нуля";
    else if (balance && value > balance.remaining_amount) next.amount = "Больше, чем осталось оплатить";
    if (!/^\d{4}-\d{2}$/.test(month)) next.month = "Выберите месяц";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    setServerError(null);
    try {
      await onSubmit({
        contract_id: Number(contractId),
        amount: amount.replace(",", "."),
        payment_method: method,
        payment_month: month,
      });
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (contracts.length === 0) {
    return <Alert tone="info">У вас нет активных контрактов для оплаты.</Alert>;
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
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
            hint={balance ? `Осталось оплатить: ${formatMoney(balance.remaining_amount)}` : undefined}
          />
        </FullRow>
        <Input
          label="Сумма"
          required
          inputMode="decimal"
          value={amount}
          error={errors.amount}
          hint={contract ? `Ежемесячный платёж: ${formatMoney(contract.monthly_payment)}` : undefined}
          onChange={(e) => setAmount(e.target.value)}
        />
        <MonthInput
          label="За какой месяц"
          required
          value={month}
          error={errors.month}
          onChange={setMonth}
        />
        <FullRow>
          <Select
            label="Способ оплаты"
            options={PAYMENT_METHODS}
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          />
        </FullRow>
      </FormGrid>
      <FormActions>
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Отмена
        </Button>
        <Button type="submit" loading={submitting}>
          Отправить на проверку
        </Button>
      </FormActions>
    </form>
  );
};

export default PaymentForm;
