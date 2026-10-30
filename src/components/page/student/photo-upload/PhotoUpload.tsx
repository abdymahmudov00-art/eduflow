"use client";

import { useRef, useState, type ChangeEvent } from "react";
import Alert from "@/components/ui/alert/Alert";
import Avatar from "@/components/ui/avatar/Avatar";
import Button from "@/components/ui/button/Button";
import { studentsApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { useStudentPhoto } from "@/lib/hooks/useStudentPhoto";
import styles from "./photo-upload.module.css";

const MAX_SIZE_MB = 5;

interface PhotoUploadProps {
  studentId: number;
  name: string;
}

/** Фото 3×4: показ текущего и загрузка нового */
const PhotoUpload = ({ studentId, name }: PhotoUploadProps) => {
  const [version, setVersion] = useState(0);
  const photoUrl = useStudentPhoto(studentId, version);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    setDone(false);
    if (!file.type.startsWith("image/")) {
      setError("Нужна картинка: JPG или PNG");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Файл больше ${MAX_SIZE_MB} МБ`);
      return;
    }
    setUploading(true);
    try {
      await studentsApi.uploadMyPhoto(file);
      setVersion((v) => v + 1);
      setDone(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.upload}>
      <Avatar name={name} size={88} src={photoUrl} />
      <div className={styles.text}>
        <strong className={styles.title}>Личная фотография 3×4</strong>
        <span className={styles.hint}>JPG или PNG, до {MAX_SIZE_MB} МБ. Лицо крупно, светлый фон.</span>
        <div className={styles.actions}>
          <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFile} />
          <Button variant="secondary" size="sm" icon="plus" loading={uploading} onClick={() => inputRef.current?.click()}>
            {photoUrl ? "Заменить фото" : "Загрузить фото"}
          </Button>
        </div>
        {error && <Alert onClose={() => setError(null)}>{error}</Alert>}
        {done && (
          <Alert tone="success" onClose={() => setDone(false)}>
            Фото загружено
          </Alert>
        )}
      </div>
    </div>
  );
};

export default PhotoUpload;
