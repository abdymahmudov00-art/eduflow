"use client";

import { useState } from "react";
import PersonalInfoForm from "@/components/page/shared/personal-info-form/PersonalInfoForm";
import PhotoUpload from "@/components/page/student/photo-upload/PhotoUpload";
import Alert from "@/components/ui/alert/Alert";
import AsyncState from "@/components/ui/async-state/AsyncState";
import Icon from "@/components/ui/icon/Icon";
import StatusBadge from "@/components/ui/status-badge/StatusBadge";
import { personalInfoApi, studentsApi } from "@/lib/api";
import { isNotFound } from "@/lib/errors";
import { formatDateTime, fullNameWithMiddle } from "@/lib/format";
import { useFetch } from "@/lib/hooks/useFetch";
import styles from "../student.module.css";

async function loadPersonal() {
  const [student, info] = await Promise.all([
    studentsApi.me(),
    personalInfoApi.me().catch((err) => {
      if (isNotFound(err)) return null;
      throw err;
    }),
  ]);
  return { student, info };
}

/** «Личное дело студента»: фото, анкета и её статус проверки */
export default function StudentPersonalPage() {
  const { data, loading, error, reload } = useFetch(loadPersonal);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const info = data?.info ?? null;

  return (
    <AsyncState loading={loading} error={error} onRetry={reload}>
      {data && (
        <div className={styles.sheet}>
          <div className={styles.sheetHead}>
            <div>
              <span className={styles.overline}>Личное дело студента</span>
              <h1 className={styles.sheetTitle}>Личная информация</h1>
            </div>
            <div className={styles.sheetMeta}>
              <strong>{info ? fullNameWithMiddle(info) : "Анкета не заполнена"}</strong>
              <StatusBadge kind="profile" status={info?.status ?? "not_submitted"} />
            </div>
          </div>

          <div className={styles.sheetBody}>
            {savedMessage && (
              <div className={styles.note}>
                <Alert tone="success" onClose={() => setSavedMessage(null)}>
                  {savedMessage}
                </Alert>
              </div>
            )}

            {info?.status === "revision" && (
              <div className={styles.note}>
                <Alert>
                  <b>Администратор вернул анкету на исправление.</b>
                  {info.review_comment && <> Комментарий: «{info.review_comment}»</>}
                </Alert>
              </div>
            )}
            {info?.status === "pending" && (
              <div className={styles.note}>
                <Alert tone="info">Анкета на проверке у администратора. Можно дополнить её, если что-то забыли.</Alert>
              </div>
            )}
            {info?.status === "approved" && (
              <div className={styles.note}>
                <Alert tone="success">
                  Анкета принята{info.reviewed_at ? ` ${formatDateTime(info.reviewed_at)}` : ""}.
                </Alert>
              </div>
            )}

            <div className={styles.photoBlock}>
              <PhotoUpload studentId={data.student.id} name={info ? fullNameWithMiddle(info) : data.student.student_number} />
            </div>

            <PersonalInfoForm
              key={`${info?.id ?? "new"}-${info?.status ?? ""}`}
              initial={info}
              sectioned
              submitText={info ? "Сохранить" : "Заполнить анкету"}
              note="Проверьте данные: администратор сверит их с документами."
              onSubmit={async (values) => {
                setSavedMessage(null);
                const saved = await personalInfoApi.updateMe(values);
                setSavedMessage(
                  saved.status === "pending" ? "Анкета сохранена и отправлена на проверку" : "Данные сохранены",
                );
                reload();
              }}
            />

            <div className={styles.soon}>
              <Icon name="info" size={18} />
              <span>
                Скан паспорта загрузить пока нельзя: хранение документов ещё настраивают на сервере.
              </span>
            </div>
          </div>
        </div>
      )}
    </AsyncState>
  );
}
