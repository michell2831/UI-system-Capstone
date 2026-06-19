import { Controller } from 'react-hook-form'
import { useTransactionForm } from './TransactionFormProvider'
import type { FieldErrors } from 'react-hook-form'
import type { TransactionFormValues } from './transactionTypes'
import { Box, Typography, Checkbox, FormHelperText } from '@mui/material'

interface DocumentationChecklistProps {
  items: { name: string; label: string }[]
}

export function DocumentationChecklist({ items }: DocumentationChecklistProps) {
  const { methods } = useTransactionForm()
  const { control, formState } = methods
  const errors = formState.errors as FieldErrors<TransactionFormValues>

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 2, borderRadius: '12px', border: '1px solid', borderColor: 'divider', bgcolor: 'rgba(0,0,0,0.01)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Documentary Compliance</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Select all that apply</Typography>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {items.map((item) => (
          <Controller
            key={item.name}
            name={`service_specific_data.documentaryCompliance.${item.name}` as const}
            control={control}
            render={({ field }) => (
              <Box
                component="label"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 2,
                  py: 1,
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                  '&:hover': {
                    borderColor: '#580000',
                  }
                }}
              >
                <Checkbox
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  size="small"
                  sx={{
                    color: 'divider',
                    p: 0,
                    '&.Mui-checked': {
                      color: '#580000',
                    },
                  }}
                />
                <Typography sx={{ fontSize: '13.5px' }}>{item.label}</Typography>
              </Box>
            )}
          />
        ))}
      </Box>
      {errors?.service_specific_data && (
        <FormHelperText error sx={{ fontSize: '11px', mt: 0.5 }}>
          Please complete all documentary compliance items.
        </FormHelperText>
      )}
    </Box>
  )
}
