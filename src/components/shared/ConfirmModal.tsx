import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Dialog, DialogContent, DialogActions, Button, Box, Typography } from '@mui/material'

interface ConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  message: string
  subtitle?: string
  alertText?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel?: () => void
}

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  message,
  subtitle,
  alertText,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const handleClose = () => {
    if (onCancel) onCancel()
    onOpenChange(false)
  }

  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      slotProps={{
        paper: {
          sx: {
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '400px',
            width: '100%',
          }
        }
      }}
    >
      <Box sx={{ display: 'flex', gap: '16px', alignItems: 'flex-start', mb: '20px' }}>
        <Box 
          sx={{
            width: '48px',
            height: '48px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            backgroundColor: '#FFF7ED',
            border: '1px solid #FFEDD5',
            color: '#EA580C',
          }}
        >
          <AlertTriangle className="h-6 w-6" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontFamily: "'DM Serif Display', Georgia, serif", 
              color: '#0F172A',
              fontWeight: 500,
              fontSize: '1.35rem',
              lineHeight: 1.3
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, mt: '2px', display: 'block' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>

      <DialogContent sx={{ p: 0, mb: '20px' }}>
        {message && (
          <Typography sx={{ fontSize: '13.5px', color: '#64748B', lineHeight: 1.6 }}>
            {message}
          </Typography>
        )}

        {alertText && (
          <Box 
            sx={{
              mt: '16px',
              p: '12px',
              borderRadius: '8px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#F0FDF4',
              color: '#166534',
              border: '1px solid #BBF7D0',
            }}
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#166534]" />
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '12px', color: '#166534' }}>
              {alertText}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 0, gap: '8px', borderTop: '1px solid rgba(0, 0, 0, 0.05)', pt: '16px', justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={handleClose}
          sx={{
            borderColor: 'divider',
            color: '#475569',
            fontWeight: 600,
            fontSize: '13.5px',
            textTransform: 'none',
            '&:hover': {
              borderColor: 'rgba(0, 0, 0, 0.15)',
              backgroundColor: 'rgba(0, 0, 0, 0.02)',
            }
          }}
        >
          {cancelText}
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          sx={{
            backgroundColor: '#580000',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '13.5px',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#7a0c0c',
            }
          }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
