"use client";

import { useState } from "react";
import ReviewPanel from "@/components/page/admin/review-panel/ReviewPanel";
import StudentForm from "@/components/page/admin/student-form/StudentForm";
import TransferForm from "@/components/page/admin/transfer-form/TransferForm";
import PersonalInfoForm from "@/components/page/shared/personal-info-form/PersonalInfoForm";
import Alert from "@/components/ui/alert/Alert";
import AsyncState from "@/components/ui/async-state/AsyncState";
import Avatar from "@/components/ui/avatar/Avatar";
import Button from "@/components/ui/button/Button";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import Input from "@/components/ui/input/Input";
import Modal from "@/components/ui/modal/Modal";
import PageHeader from "@/components/ui/page-header/PageHeader";
import ActionMenu from "@/components/ui/action-menu/ActionMenu";
import StatusBadge from "@/components/ui/status-badge/StatusBadge";
import Table from "@/components/ui/table/Table";
import Tabs from "@/components/ui/tabs/Tabs";
import { groupsApi, personalInfoApi, studentsApi } from "@/lib/api";
import type { Student } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/errors";
import { fullName, fullNameWithMiddle } from "@/lib/format";
import { useFetch } from "@/lib/hooks/useFetch";
import { useStudentPhoto } from "@/lib/hooks/useStudentPhoto";
import styles from "../admin.module.css";

type Filter = "all" | "approved" | "review" | "rejected";

/** Порядок в «Все»: сначала принятые, потом на проверке, потом остальные */
const STATUS_ORDER: Record<string, number> = { approved: 0, pending: 1, revision: 2, not_submitted: 3 };
const statusRank = (s: Student) => (s.personal_info ? STATUS_ORDER[s.personal_info.status] ?? 3 : 4);

const EMPTY_TEXT: Record<Filter, string> = {
  all: "Студентов пока нет",
  approved: "Принятых анкет пока нет",
  review: "Анкет на проверке нет",
  rejected: "Непринятых анкет нет",
};

async function loadStudents() {
  const [students, groups] = await Promise.all([studentsApi.list(), groupsApi.list()]);
  return { students, groups };
}

/** Шапка окна анкеты: фото, ФИО, номер */
function StudentCaption({ student }: { student: Student }) {
  const photoUrl = useStudentPhoto(student.id);
  const name = student.personal_info ? fullNameWithMiddle(student.personal_info) : student.student_number;
  return (
    <div className={styles.caption}>
      <Avatar name={name} size={56} src={photoUrl} />
      <div>
        <strong>{name}</strong>
        <span className={styles.muted}>{student.student_number}</span>
      </div>
    </div>
  );
}

export default function StudentsPage() {
  const { data, loading, error, reload } = useFetch(loadStudents);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  // Храним id, а не объект: после reload() окно показывает свежие данные
  const [profileId, setProfileId] = useState<number | null>(null);
  const [transferId, setTransferId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<Student | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const students = data?.students ?? [];
  const groupName = new Map((data?.groups ?? []).map((g) => [g.id, g.name]));
  const profileStudent = students.find((s) => s.id === profileId) ?? null;
  const transferStudent = students.find((s) => s.id === transferId) ?? null;
  const approved = students.filter((s) => s.personal_info?.status === "approved");
  const toReview = students.filter((s) => s.personal_info?.status === "pending");
  // Не приняты: возвращены на исправление или анкету ещё не заполнили
  const rejected = students.filter((s) => {
    const status = s.personal_info?.status;
    return status !== "approved" && status !== "pending";
  });
  const byFilter: Record<Filter, Student[]> = {
    all: [...students].sort(
      (a, b) => statusRank(a) - statusRank(b) || a.student_number.localeCompare(b.student_number, "ru", { numeric: true }),
    ),
    approved,
    review: toReview,
    rejected,
  };

  const query = search.trim().toLowerCase();
  const rows = byFilter[filter].filter((s) => {
    if (!query) return true;
    const info = s.personal_info;
    return [s.student_number, info?.first_name, info?.last_name, info?.middle_name, info?.phone]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(query));
  });

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    setActionError(null);
    try {
      await studentsApi.remove(deleting.id);
      reload();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setDeleteLoading(false);
      setDeleting(null);
    }
  };

  return (
    <>
      <PageHeader
        kicker="Студенты"
        title="Студенты и анкеты"
        description="Создание студента сразу создаёт ему аккаунт. Здесь же — перевод в другую группу и проверка анкет."
        actions={
          <Button icon="plus" onClick={() => setCreating(true)}>
            Добавить студента
          </Button>
        }
      />

      {(actionError || notice) && (
        <div className={styles.toolbar}>
          {actionError && <Alert onClose={() => setActionError(null)}>{actionError}</Alert>}
          {notice && (
            <Alert tone="success" onClose={() => setNotice(null)}>
              {notice}
            </Alert>
          )}
        </div>
      )}

      <div className={styles.toolbar}>
        <Input
          label="Поиск"
          placeholder="ФИО, телефон или номер студента"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <AsyncState loading={loading} error={error} onRetry={reload}>
        <Tabs<Filter>
          value={filter}
          onChange={setFilter}
          items={[
            { value: "all", label: "Все", count: students.length },
            { value: "approved", label: "Принятые", count: approved.length },
            { value: "review", label: "На проверке", count: toReview.length },
            { value: "rejected", label: "Не приняты", count: rejected.length },
          ]}
        />
        <Table<Student>
          rows={rows}
          rowKey={(s) => s.id}
          emptyText={query ? "Никого не нашли" : EMPTY_TEXT[filter]}
          columns={[
            { key: "number", header: "Номер", render: (s) => s.student_number },
            { key: "name", header: "ФИО", render: (s) => <strong>{fullName(s.personal_info)}</strong> },
            { key: "phone", header: "Телефон", render: (s) => s.personal_info?.phone ?? "—" },
            {
              key: "group",
              header: "Группа",
              render: (s) =>
                s.group_id !== null ? (
                  groupName.get(s.group_id) ?? `#${s.group_id}`
                ) : (
                  <span className={styles.muted}>без группы</span>
                ),
            },
            {
              key: "profile",
              header: "Анкета",
              render: (s) =>
                s.personal_info ? (
                  <StatusBadge kind="profile" status={s.personal_info.status} />
                ) : (
                  <span className={styles.muted}>нет данных</span>
                ),
            },
            {
              key: "actions",
              header: "",
              width: 56,
              align: "right",
              render: (s) => (
                <ActionMenu
                  items={[
                    { label: "Анкета", icon: "idcard", onClick: () => setProfileId(s.id) },
                    { label: "Сменить группу", icon: "layers", onClick: () => setTransferId(s.id) },
                    { label: "Удалить", icon: "trash", danger: true, onClick: () => setDeleting(s) },
                  ]}
                />
              ),
            },
          ]}
        />
      </AsyncState>

      <Modal open={creating} title="Новый студент" onClose={() => setCreating(false)} width={640}>
        <StudentForm
          groups={data?.groups ?? []}
          onCancel={() => setCreating(false)}
          onSubmit={async (values) => {
            await studentsApi.create(values);
            setCreating(false);
            reload();
          }}
        />
      </Modal>

      <Modal open={profileStudent !== null} title="Анкета студента" onClose={() => setProfileId(null)} width={680}>
        {profileStudent && (
          <>
            <StudentCaption student={profileStudent} />
            {profileStudent.personal_info && (
              <ReviewPanel
                info={profileStudent.personal_info}
                onReview={async (review) => {
                  await personalInfoApi.review(profileStudent.id, review);
                  setNotice(review.status === "approved" ? "Анкета принята" : "Анкета возвращена на исправление");
                  reload();
                }}
              />
            )}
            <PersonalInfoForm
              key={`${profileStudent.id}-${profileStudent.personal_info?.id ?? "new"}`}
              initial={profileStudent.personal_info}
              submitText={profileStudent.personal_info ? "Сохранить изменения" : "Добавить данные"}
              onCancel={() => setProfileId(null)}
              onSubmit={async (values) => {
                if (profileStudent.personal_info) await personalInfoApi.update(profileStudent.id, values);
                else await personalInfoApi.create(profileStudent.id, values);
                setNotice("Анкета сохранена");
                reload();
              }}
            />
          </>
        )}
      </Modal>

      <Modal
        open={transferStudent !== null}
        title={transferStudent ? `Группа · ${fullName(transferStudent.personal_info)}` : ""}
        onClose={() => setTransferId(null)}
        width={600}
      >
        {transferStudent && (
          <TransferForm
            key={`${transferStudent.id}-${transferStudent.group_id}-${transferStudent.group_history?.length ?? 0}`}
            student={transferStudent}
            groups={data?.groups ?? []}
            onCancel={() => setTransferId(null)}
            onSubmit={async (values) => {
              await studentsApi.update(transferStudent.id, values);
              setTransferId(null);
              setNotice(values.group_id !== undefined ? "Студент переведён" : "Изменения сохранены");
              reload();
            }}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Удалить студента?"
        message={`${fullName(deleting?.personal_info)} (${deleting?.student_number ?? ""}) будет удалён. Если у студента есть контракты или платежи, сервер не даст удалить.`}
        confirmText="Удалить"
        danger
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
