import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Controller } from 'react-hook-form'
import type { Service, User, Transaction, CreateTransactionDto } from '@/types'
import { createTransactionApi } from '@/api/mockApi'
import { ServiceDynamicFields } from './ServiceDynamicFields'
import { TransactionFormProvider, useTransactionForm } from './TransactionFormProvider'
import type { TransactionFormValues } from './transactionTypes'
import { useModals } from '@/components/shared/ModalContext'
import { 
  Dialog, DialogContent, DialogTitle, DialogActions, 
  Button, TextField, Select, MenuItem, FormControl, InputLabel, 
  FormHelperText, Box, Typography, Paper, Grid, Chip 
} from '@mui/material'

interface TransactionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  services: Service[]
  currentUser: User | null
  onCreated: (transaction: Transaction) => void
}

const ASSIGNED_TO_OPTIONS = [
  { id: 'usr-2', name: 'Jose Reyes' },
  { id: 'usr-3', name: 'Ana Cruz' },
  { id: 'usr-5', name: 'Lucia Gonzales' },
  { id: 'usr-6', name: 'Paolo Ramos' },
  { id: 'usr-8', name: 'Marco Flores' },
]

function TransactionModalInner({ open, onOpenChange, services, currentUser, onCreated }: TransactionModalProps) {
  const { methods, selectedService, selectedServiceConfig } = useTransactionForm()
  const { handleSubmit, control, formState } = methods
  const errors = formState.errors as Record<string, { message?: string }>
  const clientType = methods.watch('client_type') || 'Student'
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { confirm, showResult } = useModals()

  const selectedServiceName = selectedService?.name || ''
  const selectedServiceCategory = selectedService?.category || 'Service'

  const mutation = useMutation<Transaction, Error, CreateTransactionDto>({
    mutationFn: async (payload) => {
      if (!currentUser) throw new Error('User not authenticated')
      return createTransactionApi(payload, currentUser)
    },
    onSuccess: (transaction: Transaction) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      showResult({
        type: 'success',
        title: 'Success!',
        message: 'Transaction created successfully. Time-in recorded.',
        buttonText: 'Got it!',
        onConfirm: () => {
          onCreated(transaction)
          onOpenChange(false)
          navigate(`/transactions/${transaction.id}`)
        }
      })
    },
    onError: (error: Error) => {
      showResult({
        type: 'error',
        title: 'Error!',
        message: error.message || 'Could not create transaction',
        buttonText: 'Dismiss'
      })
    },
  })

  const onSubmit = (values: TransactionFormValues) => {
    confirm({
      title: 'Confirm Submission',
      message: 'Are you sure you want to submit this transaction? This will record the time-in and initialize OPCR service targets.',
      confirmText: 'Confirm',
      onConfirm: () => {
        const documentationStatus = selectedServiceConfig?.documentation
          ? Object.values(values.service_specific_data.documentaryCompliance || {}).every(Boolean)
            ? 'complete'
            : 'incomplete'
          : 'complete'

        const middlePart = values.client_middle_name?.trim() ? ` ${values.client_middle_name.trim()}` : ''
        const fullClientName = `${values.client_first_name.trim()}${middlePart} ${values.client_surname.trim()}`

        const payload: CreateTransactionDto = {
          service_id: values.service_id,
          assigned_to:
            values.assigned_to && values.assigned_to !== 'UNASSIGNED' ? values.assigned_to : undefined,
          client_name: fullClientName,
          client_type: values.client_type,
          student_number: values.student_number?.trim() || undefined,
          course: values.course?.trim() || undefined,
          year_level: values.year_level?.trim() || undefined,
          contact_number: values.contact_number?.trim() || undefined,
          organization: values.organization?.trim() || undefined,
          org_level: (values as any).org_level?.trim() || undefined,
          remarks: values.remarks?.trim() || undefined,
          documentation_status: documentationStatus,
          service_specific_data: values.service_specific_data,
        }

        mutation.mutate(payload)
      }
    })
  }

  const handleCancelClick = () => {
    confirm({
      title: 'Discard Changes',
      message: 'Are you sure? You have unsaved changes. All draft data will be lost.',
      confirmText: 'Confirm',
      onConfirm: () => {
        onOpenChange(false)
      }
    })
  }

  const handleClose = (_event: {}, reason: 'backdropClick' | 'escapeKeyDown') => {
    // Prevent closing via clicking backdrop
    if (reason === 'backdropClick') return
    
    confirm({
      title: 'Discard Changes',
      message: 'Are you sure? You have unsaved changes. All draft data will be lost.',
      confirmText: 'Confirm',
      onConfirm: () => {
        onOpenChange(false)
      }
    })
  }

  const remarksText = methods.watch('remarks') || ''

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="lg" 
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: '16px',
            maxHeight: 'calc(100vh - 4rem)',
          }
        }
      }}
    >
      <DialogTitle sx={{ px: { xs: 2.5, sm: 4 }, pt: 3, pb: 1 }}>
        <Box sx={{ mb: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, tracking: 'tight', color: 'text.primary' }}>
            New Service Transaction
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '13px' }}>
            Record a new transaction and auto-generate time-in, SLA, and audit timeline.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
            <Chip label={selectedServiceCategory} size="small" variant="outlined" />
            {selectedServiceName && (
              <Chip label={selectedServiceName} size="small" sx={{ bgcolor: '#580000', color: 'white', fontWeight: 600 }} />
            )}
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: { xs: 2.5, sm: 4 }, py: 1, overflowY: 'auto' }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1, pb: 2 }}>
          {/* Service Information Card */}
          <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: '12px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#580000' }}>
                Service Information
              </Typography>
              <Chip label="Time-In auto-recorded" size="small" variant="outlined" sx={{ color: '#C8960C', borderColor: '#C8960C', fontWeight: 600 }} />
            </Box>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField 
                  fullWidth 
                  label="Office / Service Office" 
                  value={currentUser?.office_name ?? ''} 
                  disabled 
                  variant="outlined" 
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="service_id"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <FormControl fullWidth error={Boolean(errors.service_id?.message)}>
                      <InputLabel>Service Type *</InputLabel>
                      <Select 
                        value={field.value} 
                        onChange={field.onChange} 
                        label="Service Type *"
                        MenuProps={{ slotProps: { paper: { sx: { maxHeight: '240px' } } } }}
                      >
                        {services.map((service) => (
                          <MenuItem key={service.id} value={service.id}>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>{service.name}</Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{service.category}</Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.service_id?.message && (
                        <FormHelperText>{errors.service_id.message}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="assigned_to"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Assign To</InputLabel>
                      <Select value={field.value} onChange={field.onChange} label="Assign To">
                        <MenuItem value="UNASSIGNED">Unassigned</MenuItem>
                        {ASSIGNED_TO_OPTIONS.map((person) => (
                          <MenuItem key={person.id} value={person.id}>
                            {person.name}
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>Only office staff can be assigned.</FormHelperText>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="client_type"
                  control={control}
                  defaultValue="Student"
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Client Type *</InputLabel>
                      <Select value={field.value} onChange={field.onChange} label="Client Type *">
                        <MenuItem value="Student">Student</MenuItem>
                        <MenuItem value="Organization Inside the PUP QC Campus">Organization Inside the PUP QC Campus</MenuItem>
                        <MenuItem value="Visitor">Visitor</MenuItem>
                        <MenuItem value="Alumni">Alumni</MenuItem>
                        <MenuItem value="Faculty">Faculty</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="remarks"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Remarks (Optional)"
                      placeholder="Optional remarks…"
                      value={field.value}
                      onChange={(e) => {
                        if (e.target.value.length <= 255) {
                          field.onChange(e.target.value)
                        }
                      }}
                      error={Boolean(errors.remarks?.message)}
                      helperText={errors.remarks?.message || `${remarksText.length} / 255`}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Client Information Card */}
          <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: '12px' }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#580000' }}>
                Client Information
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                {clientType === 'Organization Inside the PUP QC Campus' 
                  ? 'Represents the organization as the president/authorized head, not an individual request.' 
                  : 'Additional client details for the transaction.'}
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {/* Org Name for Organization client type */}
              {clientType === 'Organization Inside the PUP QC Campus' && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Controller
                      name="organization"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <TextField
                          fullWidth
                          label="Org Name *"
                          placeholder="e.g., CommiT Society"
                          value={field.value}
                          onChange={field.onChange}
                          error={Boolean(errors.organization?.message)}
                          helperText={errors.organization?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Controller
                      name="org_level"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <TextField
                          fullWidth
                          label="Org Level (Optional)"
                          placeholder="e.g., University-wide / College-based"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </Grid>
                </>
              )}

              {/* Standardized Client Name Split */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="client_first_name"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      fullWidth
                      label={clientType === 'Organization Inside the PUP QC Campus' ? 'Representative First Name *' : 'First Name *'}
                      placeholder="First Name"
                      value={field.value}
                      onChange={field.onChange}
                      error={Boolean(errors.client_first_name?.message)}
                      helperText={errors.client_first_name?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="client_middle_name"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      fullWidth
                      label="Middle Name (Optional)"
                      placeholder="Middle Name (Optional)"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="client_surname"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      fullWidth
                      label={clientType === 'Organization Inside the PUP QC Campus' ? 'Representative Surname *' : 'Surname *'}
                      placeholder="Surname"
                      value={field.value}
                      onChange={field.onChange}
                      error={Boolean(errors.client_surname?.message)}
                      helperText={errors.client_surname?.message}
                    />
                  )}
                />
              </Grid>

              {/* Student Number & Course Program Fields for Student, Alumni, and Faculty */}
              {clientType !== 'Visitor' && clientType !== 'Organization Inside the PUP QC Campus' && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Controller
                      name="student_number"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <TextField
                          fullWidth
                          label={clientType === 'Student' ? 'Student Number *' : clientType === 'Faculty' ? 'Faculty Number (Optional)' : 'Student Number (Optional)'}
                          placeholder={clientType === 'Student' ? '2026-01234-CM-0' : 'Optional Number'}
                          value={field.value}
                          onChange={field.onChange}
                          error={Boolean(errors.student_number?.message)}
                          helperText={errors.student_number?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Controller
                      name="course"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <TextField
                          fullWidth
                          label={clientType === 'Faculty' ? 'Department / Program (Optional)' : 'Course / Program' + (clientType === 'Student' ? ' *' : ' (Optional)')}
                          placeholder="e.g., BSIT"
                          value={field.value}
                          onChange={field.onChange}
                          error={Boolean(errors.course?.message)}
                          helperText={errors.course?.message}
                        />
                      )}
                    />
                  </Grid>
                </>
              )}

              {/* Spacing for contact number and year level */}
              {clientType === 'Student' && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="year_level"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <FormControl fullWidth error={Boolean(errors.year_level?.message)}>
                        <InputLabel>Year Level *</InputLabel>
                        <Select value={field.value} onChange={field.onChange} label="Year Level *">
                          <MenuItem value="1st Year">1st Year</MenuItem>
                          <MenuItem value="2nd Year">2nd Year</MenuItem>
                          <MenuItem value="3rd Year">3rd Year</MenuItem>
                          <MenuItem value="4th Year">4th Year</MenuItem>
                          <MenuItem value="Others">Others</MenuItem>
                        </Select>
                        {errors.year_level?.message && (
                          <FormHelperText>{errors.year_level.message}</FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                </Grid>
              )}
              <Grid size={{ xs: 12, sm: clientType === 'Student' ? 6 : 12 }}>
                <Controller
                  name="contact_number"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      fullWidth
                      label={`Contact Number${clientType === 'Visitor' ? ' (Optional)' : ' *'}`}
                      placeholder="09XXXXXXXXX"
                      value={field.value}
                      onChange={field.onChange}
                      error={Boolean(errors.contact_number?.message)}
                      helperText={errors.contact_number?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Service-Specific Fields */}
          <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: '12px' }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#580000' }}>
                Service-Specific Fields (Optional)
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                Fields change depending on the selected service.
              </Typography>
            </Box>
            <ServiceDynamicFields />
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2.5, sm: 4 }, py: 3, borderTop: '1px solid #E5E7EB', display: 'flex', flexDirection: { xs: 'column-reverse', sm: 'row' }, gap: '8px' }}>
        <Button variant="outlined" onClick={handleCancelClick} sx={{ textTransform: 'none', px: 3, borderColor: 'divider', color: 'text.secondary', width: { xs: '100%', sm: 'auto' } }}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          onClick={handleSubmit(onSubmit)}
          variant="contained" 
          disabled={mutation.status === 'pending'}
          sx={{ 
            textTransform: 'none', 
            px: 3, 
            bgcolor: '#580000', 
            color: 'white',
            width: { xs: '100%', sm: 'auto' },
            '&:hover': { bgcolor: '#7a0c0c' } 
          }}
        >
          {mutation.status === 'pending' ? 'Saving…' : 'Submit Transaction'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export function TransactionModal(props: TransactionModalProps) {
  const defaultValues: TransactionFormValues = {
    service_id: '',
    assigned_to: '',
    client_type: 'Student',
    client_name: '',
    client_first_name: '',
    client_middle_name: '',
    client_surname: '',
    student_number: '',
    course: '',
    year_level: '',
    contact_number: '',
    organization: '',
    org_level: '',
    remarks: '',
    service_specific_data: {
      documentaryCompliance: {
        studentID: false,
        enrollmentForm: false,
        clearance: false,
      },
      referralSourceType: '',
      hospitalOrSignatoryName: '',
      referralDateTime: '',
      verificationCode: '',
      emergencyLevel: '',
      conditionDescription: '',
      referredBy: '',
    },
  }

  return (
    <TransactionFormProvider services={props.services} defaultValues={defaultValues} open={props.open}>
      <TransactionModalInner {...props} />
    </TransactionFormProvider>
  )
}
