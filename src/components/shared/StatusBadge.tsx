import { Clock, PlayCircle, CheckCircle2 } from 'lucide-react'
import type { TransactionStatus, DocumentaryStatus, SlaStatus } from '@/types'
import { Chip } from '@mui/material'

interface StatusBadgeProps {
  status: TransactionStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = {
    pending: {
      label: 'Pending',
      icon: <Clock style={{ width: 14, height: 14 }} />,
      style: { backgroundColor: 'var(--warning-bg)', color: 'var(--warning)', borderColor: 'rgba(186, 117, 23, 0.3)', fontWeight: 600 },
    },
    in_progress: {
      label: 'In Progress',
      icon: <PlayCircle style={{ width: 14, height: 14 }} />,
      style: { backgroundColor: '#eff6ff', color: '#2563eb', borderColor: 'rgba(37, 99, 235, 0.3)', fontWeight: 600 },
    },
    completed: {
      label: 'Completed',
      icon: <CheckCircle2 style={{ width: 14, height: 14 }} />,
      style: { backgroundColor: 'var(--success-bg)', color: 'var(--success)', borderColor: 'rgba(29, 158, 117, 0.3)', fontWeight: 600 },
    },
  }[status]

  return (
    <Chip
      size="small"
      icon={config.icon}
      label={config.label}
      variant="outlined"
      style={config.style}
      className={className}
      sx={{ '& .MuiChip-icon': { color: 'inherit' } }}
    />
  )
}

interface DocumentaryBadgeProps {
  status: DocumentaryStatus
  className?: string
}

export function DocumentaryBadge({ status, className }: DocumentaryBadgeProps) {
  const config = {
    complete: {
      label: 'Complete',
      style: { backgroundColor: 'var(--success-bg)', color: 'var(--success)', borderColor: 'rgba(29, 158, 117, 0.3)', fontWeight: 600 }
    },
    incomplete: {
      label: 'Incomplete',
      style: { backgroundColor: 'var(--error-bg)', color: 'var(--error)', borderColor: 'rgba(226, 75, 74, 0.3)', fontWeight: 600 }
    },
    for_compliance: {
      label: 'For Compliance',
      style: { backgroundColor: 'var(--warning-bg)', color: 'var(--warning)', borderColor: 'rgba(186, 117, 23, 0.3)', fontWeight: 600 }
    },
  }[status]

  return (
    <Chip
      size="small"
      label={config.label}
      variant="outlined"
      style={config.style}
      className={className}
    />
  )
}

interface SLABadgeProps {
  status: SlaStatus
  isBreached?: boolean
  className?: string
}

export function SLABadge({ status, isBreached, className }: SLABadgeProps) {
  const config = {
    compliant: {
      label: 'Compliant',
      style: { backgroundColor: 'var(--success-bg)', color: 'var(--success)', borderColor: 'rgba(29, 158, 117, 0.3)', fontWeight: 600 }
    },
    non_compliant: {
      label: 'Non-Compliant',
      style: { backgroundColor: 'var(--error-bg)', color: 'var(--error)', borderColor: 'rgba(226, 75, 74, 0.3)', fontWeight: 600 }
    },
    pending_computation: {
      label: 'Pending',
      style: { backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', borderColor: 'var(--border)', fontWeight: 600 }
    },
    overridden: {
      label: 'Overridden (Manual)',
      style: { backgroundColor: '#fef3c7', color: '#1e3a8a', borderColor: '#fcd34d', fontWeight: 600 }
    },
  }[status]

  return (
    <Chip
      size="small"
      icon={isBreached ? <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--error)', display: 'inline-block' }} /> : undefined}
      label={config.label}
      variant="outlined"
      style={config.style}
      className={className}
      sx={{ '& .MuiChip-icon': { display: 'flex', alignItems: 'center', justifyContent: 'center' } }}
    />
  )
}

interface RoleBadgeProps {
  role: string
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const config: Record<string, { label: string; style: React.CSSProperties }> = {
    subsystem_admin: {
      label: 'Subsystem Admin',
      style: { backgroundColor: 'rgba(88, 0, 0, 0.08)', color: 'var(--pup-primary)', borderColor: 'rgba(88, 0, 0, 0.2)', fontWeight: 600 }
    },
    staff: {
      label: 'Staff',
      style: { backgroundColor: 'rgba(200, 150, 12, 0.12)', color: 'var(--pup-gold)', borderColor: 'rgba(200, 150, 12, 0.3)', fontWeight: 600 }
    },
    opcr_evaluator: {
      label: 'OPCR Evaluator',
      style: { backgroundColor: 'rgba(27, 58, 107, 0.08)', color: 'var(--info)', borderColor: 'rgba(27, 58, 107, 0.2)', fontWeight: 600 }
    },
  }
  const c = config[role] ?? {
    label: role,
    style: { backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', borderColor: 'var(--border)', fontWeight: 600 }
  }
  return (
    <Chip
      size="small"
      label={c.label}
      variant="outlined"
      style={c.style}
    />
  )
}
