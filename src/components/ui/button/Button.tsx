import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import Icon, { type IconName } from "@/components/ui/icon/Icon";
import styles from "./button.module.css";

type Variant = "primary" | "secondary" | "light" | "danger" | "dangerOutline" | "ghost";
type Size = "sm" | "md";

interface StyleProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  icon?: IconName;
}

function classesFor({ variant = "primary", size = "md", fullWidth = false }: StyleProps, extra?: string) {
  return [styles.button, styles[variant], styles[size], fullWidth ? styles.fullWidth : "", extra ?? ""].join(" ");
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, StyleProps {
  loading?: boolean;
}

const Button = ({
  variant,
  size,
  fullWidth,
  icon,
  loading = false,
  disabled,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) => (
  <button
    type={type}
    className={classesFor({ variant, size, fullWidth }, className)}
    disabled={disabled || loading}
    {...rest}
  >
    {loading ? (
      <span className={styles.spinner} aria-hidden="true" />
    ) : (
      icon && <Icon name={icon} size={size === "sm" ? 15 : 17} />
    )}
    <span>{children}</span>
  </button>
);

interface ButtonLinkProps extends StyleProps {
  href: string;
  children: ReactNode;
  className?: string;
}

/** Ссылка, которая выглядит как кнопка */
export const ButtonLink = ({ href, children, className, icon, ...style }: ButtonLinkProps) => (
  <Link href={href} className={classesFor(style, className)}>
    {icon && <Icon name={icon} size={style.size === "sm" ? 15 : 17} />}
    <span>{children}</span>
  </Link>
);

export default Button;
