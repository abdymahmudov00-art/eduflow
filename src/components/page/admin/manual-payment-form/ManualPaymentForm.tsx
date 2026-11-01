"use client";

import { useState, type FormEvent } from "react";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import MonthInput from "@/components/ui/month-input/MonthInput";
import Select from "@/components/ui/select/Select";
import { FormActions, FormGrid, FullRow } from "@/components/ui/form-layout/FormLayout";
import type { Contract, PaymentCreate } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/errors";
import { formatMoney, toNumber } from "@/lib/format";
import { PAYMENT_METHODS } from "@/lib/labels";

interface ManualPaymentFormProps {
  contract: Contract;
  /** "YYYY-MM" */
  month: string;
  onSubmit: (data: PaymentCreate) => Promise<void>;
  onCancel: () => void;
}

/** Админ отмечает оплату сам (например, наличными) — платёж сразу подтверждён */
const ManualPaymentForm = ({ contract, month: initialMonth, onSubmit, onCancel }: ManualPaymentFormProps) => {
  const [amount, setAmount] = useState(contract.monthly_payment.replace(/\.00$/, ""));
  const [month, setMonth] = useState(initialMonth);
  const [method, setMethod] = useState("cash");
  const [amountError, setAmountError] = useState<string>();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!(toNumber(amount.replace(",", ".")) > 0)) {
      setAmountError("Больше нуля");
      return;
    }
    setAmountError(undefined);
    setSubmitting(true);
    setServerError(null);
    try {
      await onSubmit({
        contract_id: contract.id,
        amount: amount.replace(",", "."),
        payment_month: month,
        payment_method: method,
      });
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Alert tone="info">Платёж сразу будет подтверждён и попадёт в баланс студента.</Alert>
      {serverError && (
        <div style={{ marginTop: 12 }}>
          <Alert>{serverError}</Alert>
        </div>
      )}
      <div style={{ marginTop: 16 }}>
        <FormGrid>
          <Input
            label="Сумма"
            required
            inputMode="decimal"
            value={amount}
            error={amountError}
            hint={`В месяц по контракту: ${formatMoney(contract.monthly_payment)}`}
            onChange={(e) => setAmount(e.target.value)}
          />
          <MonthInput label="За месяц" required value={month} onChange={setMonth} />
          <FullRow>
            <Select label="Способ оплаты" options={PAYMENT_METHODS} value={method} onChange={(e) => setMethod(e.target.value)} />
          </FullRow>
        </FormGrid>
      </div>
      <FormActions>
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Отмена
        </Button>
        <Button type="submit" icon="check" loading={submitting}>
          Отметить оплату
        </Button>
      </FormActions>
    </form>
  );
};

export default ManualPaymentForm;
