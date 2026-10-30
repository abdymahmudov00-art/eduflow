"use client";

import { useState } from "react";
import GroupForm from "@/components/page/admin/group-form/GroupForm";
import ScheduleManager from "@/components/page/admin/schedule-manager/ScheduleManager";
import Alert from "@/components/ui/alert/Alert";
import AsyncState from "@/components/ui/async-state/AsyncState";
import Button from "@/components/ui/button/Button";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import Modal from "@/components/ui/modal/Modal";
import PageHeader from "@/components/ui/page-header/PageHeader";
import ActionMenu from "@/components/ui/action-menu/ActionMenu";
import Table from "@/components/ui/table/Table";
import { groupsApi, studentsApi } from "@/lib/api";
import type { Group } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { useFetch } from "@/lib/hooks/useFetch";
import styles from "../admin.module.css";

async function loadGroups() {
  const [groups, students] = await Promise.all([groupsApi.list(), studentsApi.list()]);
  return { groups, students };
}

export default function GroupsPage() {
  const { data, loading, error, reload } = useFetch(loadGroups);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);
  const [deleting, setDeleting] = useState<Group | null>(null);
  // id, а не объект: после изменения расписания окно берёт свежую группу из data
  const [scheduleGroupId, setScheduleGroupId] = useState<number | null>(null);
  const scheduleGroup = data?.groups.find((g) => g.id === scheduleGroupId) ?? null;
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const countByGroup = new Map<number, number>();
  data?.students.forEach((s) => {
    if (s.group_id !== null) countByGroup.set(s.group_id, (countByGroup.get(s.group_id) ?? 0) + 1);
  });

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    setActionError(null);
    try {
      await groupsApi.remove(deleting.id);
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
        kicker="Группы"
        title="Группы и расписание"
        description="Учебные группы, курсы и постоянное расписание занятий"
        actions={<Button onClick={() => setCreating(true)}>Создать группу</Button>}
      />

      {actionError && (
        <div className={styles.toolbar}>
          <Alert onClose={() => setActionError(null)}>{actionError}</Alert>
        </div>
      )}

      <AsyncState loading={loading} error={error} onRetry={reload}>
        <Table<Group>
          rows={data?.groups ?? []}
          rowKey={(g) => g.id}
          emptyText="Групп пока нет"
          columns={[
            { key: "name", header: "Группа", render: (g) => <strong>{g.name}</strong> },
            { key: "course", header: "Курс", render: (g) => g.course_name },
            {
              key: "dates",
              header: "Период",
              render: (g) => `${formatDate(g.start_date)} — ${g.end_date ? formatDate(g.end_date) : "…"}`,
            },
            { key: "students", header: "Студентов", align: "right", render: (g) => countByGroup.get(g.id) ?? 0 },
            { key: "lessons", header: "Занятий в неделю", align: "right", render: (g) => (g.schedules ?? []).length },
            {
              key: "actions",
              header: "",
              width: 56,
              align: "right",
              render: (g) => (
                <ActionMenu
                  items={[
                    { label: "Расписание", icon: "calendar", onClick: () => setScheduleGroupId(g.id) },
                    { label: "Изменить", icon: "edit", onClick: () => setEditing(g) },
                    { label: "Удалить", icon: "trash", danger: true, onClick: () => setDeleting(g) },
                  ]}
                />
              ),
            },
          ]}
        />
      </AsyncState>

      <Modal open={creating} title="Новая группа" onClose={() => setCreating(false)}>
        <GroupForm
          onCancel={() => setCreating(false)}
          onSubmit={async (values) => {
            await groupsApi.create(values);
            setCreating(false);
            reload();
          }}
        />
      </Modal>

      <Modal open={editing !== null} title="Изменить группу" onClose={() => setEditing(null)}>
        {editing && (
          <GroupForm
            group={editing}
            onCancel={() => setEditing(null)}
            onSubmit={async (values) => {
              await groupsApi.update(editing.id, values);
              setEditing(null);
              reload();
            }}
          />
        )}
      </Modal>

      <Modal
        open={scheduleGroup !== null}
        title={scheduleGroup ? `Расписание · ${scheduleGroup.name}` : ""}
        onClose={() => setScheduleGroupId(null)}
        width={760}
      >
        {scheduleGroup && <ScheduleManager group={scheduleGroup} onChanged={reload} />}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Удалить группу?"
        message={`Группа «${deleting?.name ?? ""}» будет удалена. Группу, в которой есть студенты, удалить нельзя.`}
        confirmText="Удалить"
        danger
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
