import type { ReactNode } from "react";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import Spinner from "@/components/ui/spinner/Spinner";
import styles from "./async-state.module.css";

interface AsyncStateProps {
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  children: ReactNode;
}

/** Показывает загрузку или ошибку, иначе — содержимое */
const AsyncState = ({ loading, error, onRetry, children }: AsyncStateProps) => {
  if (loading) return <Spinner />;
  if (error) {
    return (
      <div className={styles.error}>
        <Alert>{error}</Alert>
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Повторить
          </Button>
        )}
      </div>
    );
  }
  return <>{children}</>;
};

export default AsyncState;
