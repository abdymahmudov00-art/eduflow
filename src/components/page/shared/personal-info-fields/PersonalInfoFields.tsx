import Input from "@/components/ui/input/Input";
import DateInput from "@/components/ui/date-input/DateInput";
import { FormGrid, FormSection, FullRow } from "@/components/ui/form-layout/FormLayout";

export interface PersonalInfoValues {
  first_name: string;
  last_name: string;
  middle_name: string;
  phone: string;
  birth_date: string;
  birth_place: string;
  registration_address: string;
  address: string;
}

export type PersonalInfoErrors = Partial<Record<keyof PersonalInfoValues, string>>;

export const EMPTY_PERSONAL_INFO: PersonalInfoValues = {
  first_name: "",
  last_name: "",
  middle_name: "",
  phone: "",
  birth_date: "",
  birth_place: "",
  registration_address: "",
  address: "",
};

/** Проверка по правилам бэкенда (длины полей из OpenAPI) */
export function validatePersonalInfo(values: PersonalInfoValues): PersonalInfoErrors {
  const errors: PersonalInfoErrors = {};
  if (!values.last_name.trim()) errors.last_name = "Укажите фамилию";
  else if (values.last_name.length > 100) errors.last_name = "Не больше 100 символов";
  if (!values.first_name.trim()) errors.first_name = "Укажите имя";
  else if (values.first_name.length > 100) errors.first_name = "Не больше 100 символов";
  const phone = values.phone.trim();
  if (phone.length < 5 || phone.length > 20) errors.phone = "От 5 до 20 символов";
  if (!values.birth_date) errors.birth_date = "Укажите дату рождения";
  if (values.address.length > 255) errors.address = "Не больше 255 символов";
  if (values.registration_address.length > 255) errors.registration_address = "Не больше 255 символов";
  if (values.birth_place.length > 255) errors.birth_place = "Не больше 255 символов";
  if (values.middle_name.length > 100) errors.middle_name = "Не больше 100 символов";
  return errors;
}

/** Готовит данные к отправке: пустые необязательные поля → null */
export function toPersonalInfoInput(values: PersonalInfoValues) {
  return {
    first_name: values.first_name.trim(),
    last_name: values.last_name.trim(),
    middle_name: values.middle_name.trim() || null,
    phone: values.phone.trim(),
    birth_date: values.birth_date,
    birth_place: values.birth_place.trim() || null,
    registration_address: values.registration_address.trim() || null,
    address: values.address.trim() || null,
  };
}

/** Значения формы из ответа сервера */
export function toPersonalInfoValues(info: {
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  phone: string;
  birth_date: string;
  birth_place?: string | null;
  registration_address?: string | null;
  address?: string | null;
} | null): PersonalInfoValues {
  if (!info) return EMPTY_PERSONAL_INFO;
  return {
    first_name: info.first_name,
    last_name: info.last_name,
    middle_name: info.middle_name ?? "",
    phone: info.phone,
    birth_date: info.birth_date,
    birth_place: info.birth_place ?? "",
    registration_address: info.registration_address ?? "",
    address: info.address ?? "",
  };
}

interface PersonalInfoFieldsProps {
  values: PersonalInfoValues;
  errors: PersonalInfoErrors;
  onChange: (field: keyof PersonalInfoValues, value: string) => void;
  /** Разбить поля на разделы с заголовками (как анкета «Личное дело») */
  sectioned?: boolean;
}

const PersonalInfoFields = ({ values, errors, onChange, sectioned = false }: PersonalInfoFieldsProps) => {
  const lastName = (
    <Input
      label="Фамилия"
      required
      value={values.last_name}
      error={errors.last_name}
      onChange={(e) => onChange("last_name", e.target.value)}
    />
  );
  const firstName = (
    <Input
      label="Имя"
      required
      value={values.first_name}
      error={errors.first_name}
      onChange={(e) => onChange("first_name", e.target.value)}
    />
  );
  const phone = (
    <Input
      label="Телефон"
      required
      type="tel"
      placeholder="+996 555 000 000"
      value={values.phone}
      error={errors.phone}
      onChange={(e) => onChange("phone", e.target.value)}
    />
  );
  const birthDate = (
    <DateInput
      label="Дата рождения"
      required
      value={values.birth_date}
      error={errors.birth_date}
      onChange={(v) => onChange("birth_date", v)}
    />
  );
  const middleName = (
    <Input
      label="Отчество"
      value={values.middle_name}
      error={errors.middle_name}
      onChange={(e) => onChange("middle_name", e.target.value)}
    />
  );
  const birthPlace = (
    <Input
      label="Место рождения"
      placeholder="Страна, область, город / село"
      value={values.birth_place}
      error={errors.birth_place}
      onChange={(e) => onChange("birth_place", e.target.value)}
    />
  );
  const registration = (
    <Input
      label="Адрес прописки"
      placeholder="Город, улица, дом"
      value={values.registration_address}
      error={errors.registration_address}
      onChange={(e) => onChange("registration_address", e.target.value)}
    />
  );
  const address = (
    <Input
      label="Адрес проживания"
      placeholder="Город, улица, дом"
      value={values.address}
      error={errors.address}
      onChange={(e) => onChange("address", e.target.value)}
    />
  );

  if (sectioned) {
    return (
      <>
        <FormSection title="Основная информация">
          <FormGrid>
            {lastName}
            {firstName}
            {middleName}
            {birthDate}
          </FormGrid>
        </FormSection>
        <FormSection title="Место рождения">{birthPlace}</FormSection>
        <FormSection title="Контакты">
          <FormGrid>{phone}</FormGrid>
        </FormSection>
        <FormSection title="Прописка">{registration}</FormSection>
        <FormSection title="Место проживания">{address}</FormSection>
      </>
    );
  }

  return (
    <FormGrid>
      {lastName}
      {firstName}
      {middleName}
      {birthDate}
      {phone}
      {birthPlace}
      <FullRow>{registration}</FullRow>
      <FullRow>{address}</FullRow>
    </FormGrid>
  );
};

export default PersonalInfoFields;
