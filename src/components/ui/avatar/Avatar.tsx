import styles from "./avatar.module.css";

interface AvatarProps {
  /** Из имени берутся первые буквы (до двух слов) */
  name: string;
  size?: number;
  /** URL фото; без него — инициалы */
  src?: string | null;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

const Avatar = ({ name, size = 40, src }: AvatarProps) =>
  src ? (
    // eslint-disable-next-line @next/next/no-img-element -- временный blob-URL, next/image тут не нужен
    <img src={src} alt={name} className={styles.photo} style={{ width: size, height: size }} />
  ) : (
  <span
    className={styles.avatar}
    style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    aria-hidden="true"
  >
    {initials(name)}
  </span>
  );

export default Avatar;
