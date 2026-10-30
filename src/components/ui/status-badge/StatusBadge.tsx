import Badge, { type BadgeTone } from "@/components/ui/badge/Badge";
import type { ContractStatus, PaymentStatus, PersonalInfoStatus } from "@/lib/api/types";
import { CONTRACT_STATUS_LABELS, PAYMENT_STATUS_LABELS, PROFILE_STATUS_LABELS } from "@/lib/labels";

const PAYMENT_TONES: Record<PaymentStatus, BadgeTone> = {
  pending: "warning",
  confirmed: "success",
  rejected: "danger",
};

const CONTRACT_TONES: Record<ContractStatus, BadgeTone> = {
  active: "info",
  completed: "success",
  cancelled: "neutral",
};

const PROFILE_TONES: Record<PersonalInfoStatus, BadgeTone> = {
  not_submitted: "neutral",
  pending: "warning",
  approved: "success",
  revision: "danger",
};

type StatusBadgeProps =
  | { kind: "payment"; status: PaymentStatus }
  | { kind: "contract"; status: ContractStatus }
  | { kind: "profile"; status: PersonalInfoStatus };

const StatusBadge = (props: StatusBadgeProps) => {
  if (props.kind === "payment") {
    return <Badge tone={PAYMENT_TONES[props.status]}>{PAYMENT_STATUS_LABELS[props.status]}</Badge>;
  }
  if (props.kind === "profile") {
    return <Badge tone={PROFILE_TONES[props.status]}>{PROFILE_STATUS_LABELS[props.status]}</Badge>;
  }
  return <Badge tone={CONTRACT_TONES[props.status]}>{CONTRACT_STATUS_LABELS[props.status]}</Badge>;
};

export default StatusBadge;
