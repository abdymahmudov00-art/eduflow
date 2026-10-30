"use client";

import { useState, type FormEvent } from "react";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import { FormActions } from "@/components/ui/form-layout/FormLayout";
import PersonalInfoFields, {
  toPersonalInfoInput,
  toPersonalInfoValues,
  validatePersonalInfo,
  type PersonalInfoErrors,
  type PersonalInfoValues,
} from "@/components/page/shared/personal-info-fields/PersonalInfoFields";
import type { PersonalInfo, PersonalInfoInput } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/errors";
import styles from "./personal-info-form.module.css";

interface PersonalInfoFormProps {
  initial: PersonalInfo | null;
  submitText?: string;
  onSubmit: (data: PersonalInfoInput) => Promise<void>;
  onCancel?: () => void;
  /** Поля по разделам с заголовками */
  sectioned?: boolean;
  /** Пояснение слева от кнопки сохранения */
  note?: string;
}

const PersonalInfoForm = ({
  initial,
  submitText = "Сохранить",
  onSubmit,
  onCancel,
  sectioned = false,
  note,
}: PersonalInfoFormProps) => {
  const [values, setValues] = useState<PersonalInfoValues>(() => toPersonalInfoValues(initial));
  const [errors, setErrors] = useState<PersonalInfoErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field: keyof PersonalInfoValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validatePersonalInfo(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setServerError(null);
    try {
      await onSubmit(toPersonalInfoInput(values));
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {serverError && (
        <div style={{ marginBottom: 16 }}>
          <Alert>{serverError}</Alert>
        </div>
      )}
      <PersonalInfoFields values={values} errors={errors} onChange={handleChange} sectioned={sectioned} />
      <FormActions>
        {note && <p className={styles.note}>{note}</p>}
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={submitting}>
            Отмена
          </Button>
        )}
        <Button type="submit" loading={submitting}>
          {submitText}
        </Button>
      </FormActions>
    </form>
  );
};

export default PersonalInfoForm;
