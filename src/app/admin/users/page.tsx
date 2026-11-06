"use client";

import { useState } from "react";
import UserForm from "@/components/page/admin/user-form/UserForm";
import Alert from "@/components/ui/alert/Alert";
import AsyncState from "@/components/ui/async-state/AsyncState";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import Modal from "@/components/ui/modal/Modal";
import PageHeader from "@/components/ui/page-header/PageHeader";
import ActionMenu from "@/components/ui/action-menu/ActionMenu";
import Table from "@/components/ui/table/Table";
import Tabs from "@/components/ui/tabs/Tabs";
import { usersApi } from "@/lib/api";
import type { User } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/errors";
import { useFetch } from "@/lib/hooks/useFetch";
import styles from "../admin.module.css";

type Filter = "admin" | "student";

const EMPTY_TEXT: Record<Filter, string> = {
  admin: "Администраторов нет",
  student: "Пользователей пока нет",
};

export default function UsersPage() {
  const { data, loading, error, reload } = useFetch(usersApi.list);
  const [filter, setFilter] = useState<Filter>("admin");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    setActionError(null);
    try {
      await usersApi.remove(deleting.id);
      reload();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setDeleteLoading(false);
      setDeleting(null);
    }
  };

  const byId = (a: User, b: User) => a.id - b.id;
  const admins = (data ?? []).filter((u) => u.role === "admin").sort(byId);
  const students = (data ?? []).filter((u) => u.role !== "admin").sort(byId);

  return (
    <>
      <PageHeader
        title="Пользователи"
        description="Учётные записи для входа в систему"
        actions={<Button onClick={() => setCreating(true)}>Добавить пользователя</Button>}
      />

      {actionError && (
        <div className={styles.toolbar}>
          <Alert onClose={() => setActionError(null)}>{actionError}</Alert>
        </div>
      )}

      <AsyncState loading={loading} error={error} onRetry={reload}>
        <Tabs<Filter>
          value={filter}
          onChange={setFilter}
          items={[
            { value: "admin", label: "Администраторы", count: admins.length },
            { value: "student", label: "Пользователи", count: students.length },
          ]}
        />
        <Table<User>
          rows={filter === "admin" ? admins : students}
          rowKey={(u) => u.id}
          emptyText={EMPTY_TEXT[filter]}
          columns={[
            { key: "id", header: "ID", width: 60, render: (u) => u.id },
            { key: "username", header: "Логин", render: (u) => u.username },
            {
              key: "active",
              header: "Статус",
              render: (u) =>
                u.is_active ? <Badge tone="success">Активен</Badge> : <Badge tone="neutral">Отключён</Badge>,
            },
            {
              key: "actions",
              header: "",
              width: 56,
              align: "right",
              render: (u) => (
                <ActionMenu
                  items={[
                    { label: "Изменить", icon: "edit", onClick: () => setEditing(u) },
                    { label: "Удалить", icon: "trash", danger: true, onClick: () => setDeleting(u) },
                  ]}
                />
              ),
            },
          ]}
        />
      </AsyncState>

      <Modal open={creating} title="Новый пользователь" onClose={() => setCreating(false)}>
        <UserForm
          onCancel={() => setCreating(false)}
          onSubmit={async (values) => {
            await usersApi.create(values);
            setCreating(false);
            reload();
          }}
        />
      </Modal>

      <Modal open={editing !== null} title={`Пользователь ${editing?.username ?? ""}`} onClose={() => setEditing(null)}>
        {editing && (
          <UserForm
            user={editing}
            onCancel={() => setEditing(null)}
            onSubmit={async (values) => {
              await usersApi.update(editing.id, values);
              setEditing(null);
              reload();
            }}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Удалить пользователя?"
        message={`Пользователь «${deleting?.username ?? ""}» будет удалён без возможности восстановления. Если с ним связаны данные (студент, контракты), сервер не даст удалить — тогда лучше отключить аккаунт.`}
        confirmText="Удалить"
        danger
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
