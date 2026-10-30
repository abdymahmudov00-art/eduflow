"use client";

import { useState } from "react";
import ContractForm from "@/components/page/admin/contract-form/ContractForm";
import LeaveManager from "@/components/page/admin/leave-manager/LeaveManager";
import Alert from "@/components/ui/alert/Alert";
import AsyncState from "@/components/ui/async-state/AsyncState";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import Modal from "@/components/ui/modal/Modal";
import PageHeader from "@/components/ui/page-header/PageHeader";
import ActionMenu from "@/components/ui/action-menu/ActionMenu";
import StatusBadge from "@/components/ui/status-badge/StatusBadge";
import Table from "@/components/ui/table/Table";
import Tabs from "@/components/ui/tabs/Tabs";
import { contractsApi, studentsApi } from "@/lib/api";
import type { Contract, ContractStatus } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/errors";
import { formatDate, formatMoney, fullName } from "@/lib/format";
import { useFetch } from "@/lib/hooks/useFetch";
import { activeLeaves } from "@/lib/contract";
import styles from "../admin.module.css";

type Filter = ContractStatus | "all";

async function loadContracts() {
  const [contracts, students] = await Promise.all([contractsApi.list(), studentsApi.list()]);
  return { contracts, students };
}

export default function ContractsPage() {
  const { data, loading, error, reload } = useFetch(loadContracts);
  const [filter, setFilter] = useState<Filter>("all");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Contract | null>(null);
  const [deleting, setDeleting] = useState<Contract | null>(null);
  const [leaveContractId, setLeaveContractId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const students = data?.students ?? [];
  const contracts = data?.contracts ?? [];
  const studentById = new Map(students.map((s) => [s.id, s]));
  const leaveContract = contracts.find((c) => c.id === leaveContractId) ?? null;
  const rows = filter === "all" ? contracts : contracts.filter((c) => c.status === filter);
  const count = (status: ContractStatus) => contracts.filter((c) => c.status === status).length;

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    setActionError(null);
    try {
      await contractsApi.remove(deleting.id);
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
        title="Контракты"
        description="Договоры на обучение и график оплаты"
        actions={<Button onClick={() => setCreating(true)}>Новый контракт</Button>}
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
            { value: "all", label: "Все", count: contracts.length },
            { value: "active", label: "Активные", count: count("active") },
            { value: "completed", label: "Завершённые", count: count("completed") },
            { value: "cancelled", label: "Отменённые", count: count("cancelled") },
          ]}
        />
        <Table<Contract>
          rows={rows}
          rowKey={(c) => c.id}
          emptyText="Контрактов нет"
          columns={[
            { key: "id", header: "№", width: 60, render: (c) => c.id },
            {
              key: "student",
              header: "Студент",
              render: (c) => <strong>{fullName(studentById.get(c.student_id)?.personal_info)}</strong>,
            },
            { key: "total", header: "Сумма", align: "right", render: (c) => formatMoney(c.total_amount) },
            { key: "monthly", header: "В месяц", align: "right", render: (c) => formatMoney(c.monthly_payment) },
            { key: "months", header: "Мес.", align: "right", render: (c) => c.duration_months },
            { key: "start", header: "Начало", render: (c) => formatDate(c.start_date) },
            { key: "day", header: "День оплаты", align: "right", render: (c) => (c.payment_day ? `${c.payment_day}-е` : "—") },
            {
              key: "status",
              header: "Статус",
              render: (c) => (
                <span className={styles.badges}>
                  <StatusBadge kind="contract" status={c.status} />
                  {activeLeaves(c).length > 0 && <Badge tone="info">Академ. отпуск</Badge>}
                </span>
              ),
            },
            {
              key: "actions",
              header: "",
              width: 56,
              align: "right",
              render: (c) => (
                <ActionMenu
                  items={[
                    { label: "Академ. отпуск", icon: "calendar", onClick: () => setLeaveContractId(c.id) },
                    { label: "Изменить", icon: "edit", onClick: () => setEditing(c) },
                    { label: "Удалить", icon: "trash", danger: true, onClick: () => setDeleting(c) },
                  ]}
                />
              ),
            },
          ]}
        />
      </AsyncState>

      <Modal open={creating} title="Новый контракт" onClose={() => setCreating(false)}>
        <ContractForm
          students={students}
          onCancel={() => setCreating(false)}
          onSubmit={async (values) => {
            await contractsApi.create(values);
            setCreating(false);
            reload();
          }}
        />
      </Modal>

      <Modal open={editing !== null} title={`Контракт №${editing?.id ?? ""}`} onClose={() => setEditing(null)}>
        {editing && (
          <ContractForm
            contract={editing}
            students={students}
            onCancel={() => setEditing(null)}
            onSubmit={async (values) => {
              await contractsApi.update(editing.id, values);
              setEditing(null);
              reload();
            }}
          />
        )}
      </Modal>

      <Modal
        open={leaveContract !== null}
        title={
          leaveContract
            ? `Академ. отпуск · ${fullName(studentById.get(leaveContract.student_id)?.personal_info)}, контракт №${leaveContract.id}`
            : ""
        }
        onClose={() => setLeaveContractId(null)}
        width={600}
      >
        {leaveContract && <LeaveManager contract={leaveContract} onChanged={reload} />}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Удалить контракт?"
        message={`Контракт №${deleting?.id ?? ""} будет удалён без возможности восстановления.`}
        confirmText="Удалить"
        danger
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
