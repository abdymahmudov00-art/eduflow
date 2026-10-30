import { http } from "./client";
import type { AcademicLeave, AcademicLeaveInput, Contract, ContractInput } from "./types";

export const contractsApi = {
  list: () => http.get<Contract[]>("/contracts/"),
  my: () => http.get<Contract[]>("/contracts/my"),
  get: (id: number) => http.get<Contract>(`/contracts/${id}`),
  create: (data: ContractInput) => http.post<Contract>("/contracts/", data),
  /** Полная замена всех полей (статус через API не меняется) */
  update: (id: number, data: ContractInput) => http.put<Contract>(`/contracts/${id}`, data),
  remove: (id: number) => http.delete(`/contracts/${id}`),
  /** Академический отпуск (админ) */
  addLeave: (contractId: number, data: AcademicLeaveInput) =>
    http.post<AcademicLeave>(`/contracts/${contractId}/leaves`, data),
  cancelLeave: (contractId: number, leaveId: number) =>
    http.delete(`/contracts/${contractId}/leaves/${leaveId}`),
};
