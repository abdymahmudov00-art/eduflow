"use client";

import Link from "next/link";
import Avatar from "@/components/ui/avatar/Avatar";
import { formatTodayLabel, greetingFor } from "@/lib/format";
import { useToday } from "@/lib/hooks/useToday";
import styles from "./greeting.module.css";

interface GreetingProps {
  name: string;
  /** Полное имя для аватара (по умолчанию name) */
  avatarName?: string;
  profileHref: string;
}

/** Приветствие на главной: дата, «Добрый день, Имя» и аватар */
const Greeting = ({ name, avatarName, profileHref }: GreetingProps) => {
  const today = useToday();

  return (
    <div className={styles.greeting}>
      <div>
        <span className={styles.date}>{today ? formatTodayLabel(today) : " "}</span>
        <h1 className={styles.title}>
          {today ? greetingFor(today) : "Здравствуйте"}, {name}
        </h1>
      </div>
      <Link href={profileHref} aria-label="Профиль" className={styles.avatar}>
        <Avatar name={avatarName ?? name} size={44} />
      </Link>
    </div>
  );
};

export default Greeting;
