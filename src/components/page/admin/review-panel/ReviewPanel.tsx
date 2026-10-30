"use client";

import { useState } from "react";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import StatusBadge from "@/components/ui/status-badge/StatusBadge";
import Textarea from "@/components/ui/textarea/Textarea";
import type { PersonalInfo, PersonalInfoReview } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";
import styles from "./review-panel.module.css";

interface ReviewPanelProps {
  info: PersonalInfo;
  onReview: (data: PersonalInfoReview) => Promise<void>;
}

/** Проверка анкеты админом: принять или вернуть с комментарием */
const ReviewPanel = ({ info, onReview }: ReviewPanelProps) => {
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState<string>();
  const [busy, setBusy] = useState<"approved" | "revision" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const send = async (status: "approved" | "revision") => {
    if (status === "revision" && !comment.trim()) {
      setCommentError("Напишите, что исправить");
      return;
    }
    setCommentError(undefined);
    setBusy(status);
    setError(null);
    try {
      await onReview({ status, comment: comment.trim() || null });
      setComment("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className={styles.panel}>
      <div className={styles.head}>
        <span className={styles.title}>Проверка анкеты</span>
        <StatusBadge kind="profile" status={info.status} />
      </div>
      {info.reviewed_at && (
        <span className={styles.meta}>
          Последняя проверка: {formatDateTime(info.reviewed_at)}
          {info.review_comment ? ` · «${info.review_comment}»` : ""}
        </span>
      )}
      {error && <Alert onClose={() => setError(null)}>{error}</Alert>}
      <Textarea
        label="Комментарий для студента"
        placeholder="Например: укажите адрес прописки как в паспорте"
        rows={2}
        value={comment}
        error={commentError}
        onChange={(e) => setComment(e.target.value)}
      />
      <div className={styles.actions}>
        <Button variant="dangerOutline" size="sm" loading={busy === "revision"} disabled={busy !== null} onClick={() => send("revision")}>
          Вернуть на исправление
        </Button>
        <Button size="sm" icon="check" loading={busy === "approved"} disabled={busy !== null} onClick={() => send("approved")}>
          Принять анкету
        </Button>
      </div>
    </section>
  );
};

export default ReviewPanel;
