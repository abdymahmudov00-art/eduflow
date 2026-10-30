import { useId, type InputHTMLAttributes } from "react";
import styles from "./checkbox.module.css";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

const Checkbox = ({ label, id, ...rest }: CheckboxProps) => {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <label htmlFor={inputId} className={styles.wrapper}>
      <input id={inputId} type="checkbox" className={styles.input} {...rest} />
      <span>{label}</span>
    </label>
  );
};

export default Checkbox;
