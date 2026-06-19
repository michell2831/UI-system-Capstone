import { Dialog, Box, Typography, Button } from '@mui/material'

interface ResultModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type?: 'success' | 'error' | 'next'
  title?: string
  message: string
  buttonText?: string
  onConfirm?: () => void
}

export function ResultModal({
  open,
  onOpenChange,
  type = 'success',
  title,
  message,
  buttonText,
  onConfirm,
}: ResultModalProps) {
  const isSuccess = type === "success"
  const isNext = type === "next"

  const handleClose = () => {
    if (onConfirm) onConfirm()
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
            padding: '36px 32px 28px',
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center',
            boxSizing: 'border-box',
          }
        }
      }}
    >
      {/* Icon Circle */}
      <Box
        sx={{
          width: '68px',
          height: '68px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          background: isNext ? "#FAEEDA" : (isSuccess ? "#E8F5E9" : "#FEF2F2"),
          border: isNext ? "1.5px solid rgba(200,150,12,0.25)" : (isSuccess ? "1.5px solid rgba(76,175,80,0.2)" : "1.5px solid rgba(239,68,68,0.15)"),
        }}
      >
        {isNext ? (
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
            stroke="#C8960C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <polyline points="12 16 14 18 18 14" />
          </svg>
        ) : isSuccess ? (
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
            stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        ) : (
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
            stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        )}
      </Box>

      {/* Title */}
      <Typography
        variant="h6"
        sx={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontSize: '22px',
          fontWeight: 500,
          color: '#0F172A',
          margin: '0 0 10px',
        }}
      >
        {title || (isNext ? "Period Transition" : isSuccess ? "Success!" : "Something went wrong")}
      </Typography>

      {/* Message */}
      <Typography
        sx={{
          fontSize: '13.5px',
          color: '#64748B',
          lineHeight: 1.6,
          margin: '0 0 28px',
        }}
      >
        {message || (isNext
          ? "The system has automatically moved to the next evaluation period."
          : isSuccess
          ? "The action was completed successfully."
          : "An error occurred. Please try again."
        )}
      </Typography>

      {/* Close Button */}
      <Button
        variant="contained"
        fullWidth
        onClick={handleClose}
        sx={{
          padding: '11px 32px',
          fontSize: '13.5px',
          fontWeight: 600,
          color: '#ffffff',
          borderRadius: '6px',
          textTransform: 'none',
          background: isNext ? "#580000" : (isSuccess ? "#15803D" : "#EF4444"),
          boxShadow: isNext
            ? "0 2px 8px rgba(88,0,0,0.22)"
            : isSuccess
            ? "0 2px 8px rgba(21,128,61,0.2)"
            : "0 2px 8px rgba(239,68,68,0.2)",
          '&:hover': {
            background: isNext ? "#7a0c0c" : (isSuccess ? "#15803D" : "#EF4444"),
            filter: 'brightness(1.1)',
            transform: 'translateY(-1px)',
            boxShadow: isNext
              ? "0 4px 12px rgba(88,0,0,0.3)"
              : isSuccess
              ? "0 4px 12px rgba(21,128,61,0.3)"
              : "0 4px 12px rgba(239,68,68,0.3)",
          }
        }}
      >
        {buttonText || (isNext ? "Got it!" : isSuccess ? "Got it!" : "Try Again")}
      </Button>
    </Dialog>
  )
}
