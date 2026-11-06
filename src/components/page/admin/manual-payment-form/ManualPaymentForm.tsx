"use client";

import { useState, type FormEvent } from "react";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import MonthInput from "@/components/ui/month-input/MonthInput";
import Select from "@/components/ui/select/Select";
import { FormActions, FormGrid, FullRow } from "@/components/ui/form-layout/FormLayout";
import { uuid4 } from "@/lib/api/payments";
import type { Contract, PaymentCreate } from "@/lib/api/types";
import { monthBlockReason, type ContractMonth } from "@/lib/contract";
import { getErrorMessage, isFinalError } from "@/lib/errors";
import { formatMoney, toNumber } from "@/lib/format";
import { PAYMENT_METHODS } from "@/lib/labels";

interface ManualPaymentFormProps {
  contract: Contract;
  /** Помесячный график контракта (buildContractMonths) */
  months: ContractMonth[];
  /** "YYYY-MM" */
  month: string;
  onSubmit: (data: PaymentCreate) => Promise<void>;
  onCancel: () => void;
}

const amountText = (n: number) => String(Math.round(n * 100) / 100);

/** Админ отмечает оплату сам (например, наличными) — платёж сразу подтверждён */
const ManualPaymentForm = ({ contract, months, month: initialMonth, onSubmit, onCancel }: ManualPaymentFormProps) => {
  const remainingFor = (key: string) => months.find((m) => m.key === key)?.remainingAmount;
  const [month, setMonth] = useState(initialMonth);
  const [amount, setAmount] = useState(() =>
    amountText(remainingFor(initialMonth) || toNumber(contract.monthly_payment)),
  );
  const [method, setMethod] = useState("cash");
  const [amountError, setAmountError] = useState<string>();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [requestId, setRequestId] = useState(uuid4);

  // «Колледж»: оплата идёт в общий баланс, месяц не выбираем
  const isCollege = contract.type === "college";
  const monthInfo = isCollege ? undefined : months.find((m) => m.key === month);
  const blockReason = isCollege ? null : monthBlockReason(monthInfo);

  const handleMonthChange = (key: string) => {
    setMonth(key);
    const rest = remainingFor(key);
    if (rest) setAmount(amountText(rest));
    setAmountError(undefined);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (blockReason) return;
    const value = toNumber(amount.replace(",", "."));
    if (!(value > 0)) {
      setAmountError("Больше нуля");
      return;
    }
    if (monthInfo && value > monthInfo.remainingAmount) {
      setAmountError(`Не больше остатка за месяц: ${formatMoney(monthInfo.remainingAmount)}`);
      return;
    }
    setAmountError(undefined);
    setSubmitting(true);
    setServerError(null);
    try {
      await onSubmit({
        request_id: requestId,
        contract_id: contract.id,
        amount: amount.replace(",", "."),
        payment_month: isCollege ? null : month,
        payment_method: method,
      });
    } catch (err) {
      setServerError(getErrorMessage(err));
      if (isFinalError(err)) setRequestId(uuid4());
    } finally {
      setSubmitting(false);
    }
  };

  const monthHint = monthInfo
    ? `Оплачено ${formatMoney(monthInfo.paidAmount)}${
        monthInfo.pendingAmount > 0 ? `, на проверке ${formatMoney(monthInfo.pendingAmount)}` : ""
      } из ${formatMoney(monthInfo.dueAmount)}`
    : undefined;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Alert tone="info">Платёж сразу будет подтверждён и попадёт в баланс студента. Можно отметить часть суммы.</Alert>
      {serverError && (
        <div style={{ marginTop: 12 }}>
          <Alert>{serverError}</Alert>
        </div>
      )}
      <div style={{ marginTop: 16 }}>
        <FormGrid>
          {!isCollege && (
            <MonthInput
              label="За месяц"
              required
              value={month}
              error={blockReason ?? undefined}
              hint={monthHint}
              onChange={handleMonthChange}
            />
          )}
          <Input
            label="Сумма"
            required
            inputMode="decimal"
            value={amount}
            error={amountError}
            hint={
              monthInfo && !blockReason ? `Остаток за месяц: ${formatMoney(monthInfo.remainingAmount)}` : undefined
            }
            onChange={(e) => {
              setAmount(e.target.value);
              setAmountError(undefined);
            }}
          />
          <FullRow>
            <Select label="Способ оплаты" options={PAYMENT_METHODS} value={method} onChange={(e) => setMethod(e.target.value)} />
          </FullRow>
        </FormGrid>
      </div>
      <FormActions>
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Отмена
        </Button>
        <Button type="submit" icon="check" loading={submitting} disabled={Boolean(blockReason)}>
          Отметить оплату
        </Button>
      </FormActions>
    </form>
  );
};

export default ManualPaymentForm;
