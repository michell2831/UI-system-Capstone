import { useState, useEffect } from 'react'
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
  { id: 'usr-1', name: 'Cedrick A asusula' },
  { id: 'usr-2', name: 'Ryan Donayre' },
  { id: 'usr-3', name: 'Mark bellen' },
  { id: 'usr-4', name: 'Rod benedict Tbalizo' },
  { id: 'usr-5', name: 'renren reas' },
  { id: 'usr-6', name: 'mikhail reveche' },
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

  const [currentStep, setCurrentStep] = useState(1)

  useEffect(() => {
    if (open) {
      setCurrentStep(1)
    }
  }, [open])

  const handleNextClick = async () => {
    if (currentStep === 1) {
      const isValid = await methods.trigger(['service_id', 'assigned_to', 'client_type', 'remarks'])
      if (isValid) {
        setCurrentStep(2)
      }
    } else if (currentStep === 2) {
      const isValid = await methods.trigger([
        'client_first_name',
        'client_middle_name',
        'client_surname',
        'student_number',
        'course',
        'year_level',
        'contact_number',
        'organization',
        'org_level'
      ])
      if (isValid) {
        setCurrentStep(3)
      }
    } else if (currentStep === 3) {
      const isValid = await methods.trigger('service_specific_data')
      if (isValid) {
        setCurrentStep(4)
      }
    }
  }

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
  const steps = [
    { number: 1, label: 'Service Information' },
    { number: 2, label: 'Client Information' },
    { number: 3, label: 'Service-Specific Fields' },
    { number: 4, label: 'Review & Submit' }
  ]

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      sx={{
        zIndex: 1300,
        '& .MuiDialog-container': {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        '& .MuiBackdrop-root': {
          bgcolor: 'rgba(0,0,0,0.4)',
        },
        '& .MuiDialog-paper': {
          width: '90vw',
          maxWidth: '760px',
          maxHeight: '90vh',
          borderRadius: '12px',
          bgcolor: '#FFFFFF',
          p: '24px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          margin: 0,
        },
        '& .MuiDialogContent-root': {
          p: 0,
          overflowY: 'hidden',
        },
        '& .MuiOutlinedInput-root': {
          borderRadius: '6px',
          fontSize: '13px',
          backgroundColor: '#FFFFFF',
          '&:not(.MuiInputBase-multiline)': {
            height: '36px',
          },
          '&.MuiInputBase-multiline': {
            minHeight: '80px',
            '& textarea': {
              resize: 'none',
            }
          },
          '& fieldset': {
            borderColor: '#D1D5DB !important',
            borderWidth: '1px !important',
          },
          '&:hover fieldset': {
            borderColor: '#D1D5DB !important',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#580000 !important',
            borderWidth: '1px !important',
          },
        },
        '& .MuiFormControl-root': {
          display: 'flex',
          flexDirection: 'column',
          '& .MuiInputLabel-root': {
            position: 'relative',
            transform: 'none',
            mb: '6px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#374151',
            '& .MuiFormLabel-asterisk': {
              color: '#E24B4A',
            }
          }
        },
        '& .MuiTextField-root': {
          display: 'flex',
          flexDirection: 'column',
          '& .MuiInputLabel-root': {
            position: 'relative',
            transform: 'none',
            mb: '6px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#374151',
            '& .MuiFormLabel-asterisk': {
              color: '#E24B4A',
            }
          }
        },
        '& .MuiOutlinedInput-notchedOutline legend': {
          display: 'none',
        },
        '& .MuiInputBase-input::placeholder': {
          fontSize: '13px',
          color: '#9CA3AF',
          opacity: 1,
        },
        '& .MuiFormHelperText-root': {
          fontSize: '11px',
          mt: '4px',
        }
      }}
    >
      <DialogTitle sx={{ p: 0, mb: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography sx={{ fontSize: '18px', fontWeight: 600, fontFamily: '"DM Sans", sans-serif', color: '#111827', lineHeight: 1.2 }}>
            New Service Transaction
          </Typography>
          <Typography sx={{ color: '#6B7280', fontSize: '13px', fontFamily: '"DM Sans", sans-serif' }}>
            Record a new transaction and auto-generate time-in, SLA, and audit timeline.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
            <Chip 
              label={selectedServiceCategory} 
              size="small" 
              variant="outlined" 
              sx={{ borderRadius: '9999px', fontSize: '11px', color: '#6B7280', borderColor: '#D1D5DB' }} 
            />
            {selectedServiceName && (
              <Chip 
                label={selectedServiceName} 
                size="small" 
                sx={{ bgcolor: '#580000', color: 'white', fontWeight: 600, borderRadius: '9999px', fontSize: '11px' }} 
              />
            )}
          </Box>
        </Box>
      </DialogTitle>

      {/* Step Indicator */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 3, borderBottom: '1px solid #F3F4F6', pb: 2 }}>
        {steps.map((step, idx) => {
          const isCompleted = currentStep > step.number
          const isActive = currentStep === step.number
          const color = isCompleted ? '#1D9E75' : (isActive ? '#580000' : '#D1D5DB')
          
          return (
            <Box key={step.number} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box 
                sx={{ 
                  width: 20, 
                  height: 20, 
                  borderRadius: '50%', 
                  bgcolor: color, 
                  color: '#FFFFFF', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: '"DM Sans", sans-serif'
                }}
              >
                {isCompleted ? '✓' : step.number}
              </Box>
              <Typography 
                sx={{ 
                  fontSize: '12px', 
                  fontWeight: isActive ? 600 : 500, 
                  color: color,
                  fontFamily: '"DM Sans", sans-serif'
                }}
              >
                {step.label}
              </Typography>
              {idx < steps.length - 1 && (
                <Typography sx={{ color: '#D1D5DB', mx: 0.5 }}>→</Typography>
              )}
            </Box>
          )
        })}
      </Box>

      <DialogContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          
          {/* STEP 1: Service Information */}
          {currentStep === 1 && (
            <Box sx={{ border: '1px solid #E5E7EB', borderRadius: '8px', p: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Box>
                <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#580000', fontFamily: '"DM Sans", sans-serif' }}>
                  Service Information
                </Typography>
                <Typography sx={{ fontSize: '12px', color: '#6B7280', fontFamily: '"DM Sans", sans-serif', mt: '2px' }}>
                  Specify the service and assignment details for this transaction.
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#374151', mb: '6px' }}>Office / Service Office</Typography>
                    <TextField 
                      fullWidth 
                      value={currentUser?.office_name ?? ''} 
                      disabled 
                      variant="outlined"
                      sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#F3F4F6' } }}
                    />
                  </Box>
                </Grid>
                
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#374151', mb: '6px' }}>Service Type <span style={{ color: '#E24B4A' }}>*</span></Typography>
                    <Controller
                      name="service_id"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <FormControl fullWidth error={Boolean(errors.service_id?.message)}>
                          <Select 
                            value={field.value} 
                            onChange={field.onChange} 
                            displayEmpty
                            renderValue={(selected) => {
                              if (!selected) {
                                return <span style={{ color: '#9CA3AF' }}>Select a service…</span>
                              }
                              const svc = services.find(s => s.id === selected)
                              return svc ? svc.name : ''
                            }}
                            MenuProps={{ slotProps: { paper: { sx: { maxHeight: '200px' } } } }}
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
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#374151', mb: '6px' }}>Assign To</Typography>
                    <Controller
                      name="assigned_to"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <Select value={field.value} onChange={field.onChange}>
                            <MenuItem value="UNASSIGNED">Unassigned</MenuItem>
                            {ASSIGNED_TO_OPTIONS.map((person) => (
                              <MenuItem key={person.id} value={person.id}>
                                {person.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#374151', mb: '6px' }}>Client Type <span style={{ color: '#E24B4A' }}>*</span></Typography>
                    <Controller
                      name="client_type"
                      control={control}
                      defaultValue="Student"
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <Select value={field.value} onChange={field.onChange}>
                            <MenuItem value="Student">Student</MenuItem>
                            <MenuItem value="Organization Inside the PUP QC Campus">Organization Inside the PUP QC Campus</MenuItem>
                            <MenuItem value="Visitor">Visitor</MenuItem>
                            <MenuItem value="Alumni">Alumni</MenuItem>
                            <MenuItem value="Faculty">Faculty</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Box>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#374151', mb: '6px' }}>Remarks (Optional)</Typography>
                    <Controller
                      name="remarks"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
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
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* STEP 2: Client Information */}
          {currentStep === 2 && (
            <Box sx={{ border: '1px solid #E5E7EB', borderRadius: '8px', p: '20px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '55vh', overflowY: 'auto' }}>
              <Box>
                <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#580000', fontFamily: '"DM Sans", sans-serif' }}>
                  Client Information
                </Typography>
                <Typography sx={{ fontSize: '12px', color: '#6B7280', fontFamily: '"DM Sans", sans-serif', mt: '2px' }}>
                  {clientType === 'Organization Inside the PUP QC Campus' 
                    ? 'Represents the organization as the president/authorized head.' 
                    : 'Personal details for the transaction.'}
                </Typography>
              </Box>

              <Grid container spacing={2}>
                {clientType === 'Organization Inside the PUP QC Campus' && (
                  <>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#374151', mb: '6px' }}>Org Name <span style={{ color: '#E24B4A' }}>*</span></Typography>
                        <Controller
                          name="organization"
                          control={control}
                          defaultValue=""
                          render={({ field }) => (
                            <TextField
                              fullWidth
                              placeholder="e.g., Jose Reyes"
                              value={field.value}
                              onChange={field.onChange}
                              error={Boolean(errors.organization?.message)}
                              helperText={errors.organization?.message}
                            />
                          )}
                        />
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#374151', mb: '6px' }}>Org Level (Optional)</Typography>
                        <Controller
                          name="org_level"
                          control={control}
                          defaultValue=""
                          render={({ field }) => (
                            <TextField
                              fullWidth
                              placeholder="e.g., College-based"
                              value={field.value}
                              onChange={field.onChange}
                            />
                          )}
                        />
                      </Box>
                    </Grid>
                  </>
                )}

                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#374151', mb: '6px' }}>
                      {clientType === 'Organization Inside the PUP QC Campus' ? 'Rep. First Name' : 'First Name'} <span style={{ color: '#E24B4A' }}>*</span>
                    </Typography>
                    <Controller
                      name="client_first_name"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <TextField
                          fullWidth
                          placeholder="First Name"
                          value={field.value}
                          onChange={field.onChange}
                          error={Boolean(errors.client_first_name?.message)}
                          helperText={errors.client_first_name?.message}
                        />
                      )}
                    />
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#374151', mb: '6px' }}>Middle Name (Optional)</Typography>
                    <Controller
                      name="client_middle_name"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <TextField
                          fullWidth
                          placeholder="Middle Name (Optional)"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#374151', mb: '6px' }}>
                      {clientType === 'Organization Inside the PUP QC Campus' ? 'Rep. Surname' : 'Surname'} <span style={{ color: '#E24B4A' }}>*</span>
                    </Typography>
                    <Controller
                      name="client_surname"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <TextField
                          fullWidth
                          placeholder="Surname"
                          value={field.value}
                          onChange={field.onChange}
                          error={Boolean(errors.client_surname?.message)}
                          helperText={errors.client_surname?.message}
                        />
                      )}
                    />
                  </Box>
                </Grid>

                {clientType !== 'Visitor' && clientType !== 'Organization Inside the PUP QC Campus' && (
                  <>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#374151', mb: '6px' }}>
                          {clientType === 'Faculty' ? 'Faculty Number (Optional)' : 'Student Number' + (clientType === 'Student' ? ' *' : ' (Optional)')}
                        </Typography>
                        <Controller
                          name="student_number"
                          control={control}
                          defaultValue=""
                          render={({ field }) => (
                            <TextField
                              fullWidth
                              placeholder={clientType === 'Student' ? '2026-01234-CM-0' : 'Optional Number'}
                              value={field.value}
                              onChange={field.onChange}
                              error={Boolean(errors.student_number?.message)}
                              helperText={errors.student_number?.message}
                            />
                          )}
                        />
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#374151', mb: '6px' }}>
                          {clientType === 'Faculty' ? 'Department (Optional)' : 'Course / Program' + (clientType === 'Student' ? ' *' : ' (Optional)')}
                        </Typography>
                        <Controller
                          name="course"
                          control={control}
                          defaultValue=""
                          render={({ field }) => (
                            <TextField
                              fullWidth
                              placeholder="e.g., BSIT"
                              value={field.value}
                              onChange={field.onChange}
                              error={Boolean(errors.course?.message)}
                              helperText={errors.course?.message}
                            />
                          )}
                        />
                      </Box>
                    </Grid>
                  </>
                )}

                {clientType === 'Student' && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#374151', mb: '6px' }}>Year Level <span style={{ color: '#E24B4A' }}>*</span></Typography>
                      <Controller
                        name="year_level"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                          <FormControl fullWidth error={Boolean(errors.year_level?.message)}>
                            <Select value={field.value} onChange={field.onChange}>
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
                    </Box>
                  </Grid>
                )}

                <Grid size={{ xs: 12, sm: clientType === 'Student' ? 6 : 12 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#374151', mb: '6px' }}>
                      Contact Number {clientType !== 'Visitor' && <span style={{ color: '#E24B4A' }}>*</span>}
                    </Typography>
                    <Controller
                      name="contact_number"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <TextField
                          fullWidth
                          placeholder="09XXXXXXXXX"
                          value={field.value}
                          onChange={field.onChange}
                          error={Boolean(errors.contact_number?.message)}
                          helperText={errors.contact_number?.message}
                        />
                      )}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* STEP 3: Service-Specific Fields */}
          {currentStep === 3 && (
            <Box sx={{ border: '1px solid #E5E7EB', borderRadius: '8px', p: '20px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '55vh', overflowY: 'auto' }}>
              <Box>
                <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#580000', fontFamily: '"DM Sans", sans-serif' }}>
                  Service-Specific Fields
                </Typography>
                <Typography sx={{ fontSize: '12px', color: '#6B7280', fontFamily: '"DM Sans", sans-serif', mt: '2px' }}>
                  Required documents and custom fields based on Citizen's Charter.
                </Typography>
              </Box>

              <ServiceDynamicFields />
            </Box>
          )}

          {/* STEP 4: Review & Submit */}
          {currentStep === 4 && (
            <Box sx={{ border: '1px solid #E5E7EB', borderRadius: '8px', p: '20px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '55vh', overflowY: 'auto' }}>
              <Box>
                <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#580000', fontFamily: '"DM Sans", sans-serif' }}>
                  Review &amp; Submit
                </Typography>
                <Typography sx={{ fontSize: '12px', color: '#6B7280', fontFamily: '"DM Sans", sans-serif', mt: '2px' }}>
                  Review the entered transaction details before submitting.
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#580000', textTransform: 'uppercase', fontSize: '10px' }}>Service Information</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography sx={{ fontSize: '11px', color: '#6B7280', fontWeight: 500 }}>Office</Typography>
                  <Typography sx={{ fontSize: '13px', color: '#111827', fontWeight: 600 }}>{currentUser?.office_name || 'N/A'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography sx={{ fontSize: '11px', color: '#6B7280', fontWeight: 500 }}>Service Name</Typography>
                  <Typography sx={{ fontSize: '13px', color: '#111827', fontWeight: 600 }}>{selectedServiceName || 'N/A'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography sx={{ fontSize: '11px', color: '#6B7280', fontWeight: 500 }}>Assigned To</Typography>
                  <Typography sx={{ fontSize: '13px', color: '#111827', fontWeight: 600 }}>
                    {ASSIGNED_TO_OPTIONS.find(o => o.id === methods.getValues('assigned_to'))?.name || 'Unassigned'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography sx={{ fontSize: '11px', color: '#6B7280', fontWeight: 500 }}>Client Type</Typography>
                  <Typography sx={{ fontSize: '13px', color: '#111827', fontWeight: 600 }}>{methods.getValues('client_type')}</Typography>
                </Grid>
                {methods.getValues('remarks') && (
                  <Grid size={{ xs: 12 }}>
                    <Typography sx={{ fontSize: '11px', color: '#6B7280', fontWeight: 500 }}>Remarks</Typography>
                    <Typography sx={{ fontSize: '13px', color: '#111827', whiteSpace: 'pre-wrap' }}>{methods.getValues('remarks')}</Typography>
                  </Grid>
                )}

                <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#580000', textTransform: 'uppercase', fontSize: '10px' }}>Client Details</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography sx={{ fontSize: '11px', color: '#6B7280', fontWeight: 500 }}>First Name</Typography>
                  <Typography sx={{ fontSize: '13px', color: '#111827', fontWeight: 600 }}>{methods.getValues('client_first_name')}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography sx={{ fontSize: '11px', color: '#6B7280', fontWeight: 500 }}>Middle Name</Typography>
                  <Typography sx={{ fontSize: '13px', color: '#111827', fontWeight: 600 }}>{methods.getValues('client_middle_name') || '—'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography sx={{ fontSize: '11px', color: '#6B7280', fontWeight: 500 }}>Surname</Typography>
                  <Typography sx={{ fontSize: '13px', color: '#111827', fontWeight: 600 }}>{methods.getValues('client_surname')}</Typography>
                </Grid>

                {clientType === 'Organization Inside the PUP QC Campus' && (
                  <>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography sx={{ fontSize: '11px', color: '#6B7280', fontWeight: 500 }}>Organization</Typography>
                      <Typography sx={{ fontSize: '13px', color: '#111827', fontWeight: 600 }}>{methods.getValues('organization')}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography sx={{ fontSize: '11px', color: '#6B7280', fontWeight: 500 }}>Org Level</Typography>
                      <Typography sx={{ fontSize: '13px', color: '#111827', fontWeight: 600 }}>{methods.getValues('org_level') || '—'}</Typography>
                    </Grid>
                  </>
                )}

                {clientType !== 'Visitor' && clientType !== 'Organization Inside the PUP QC Campus' && (
                  <>
                    {methods.getValues('student_number') && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography sx={{ fontSize: '11px', color: '#6B7280', fontWeight: 500 }}>
                          {clientType === 'Faculty' ? 'Faculty Number' : 'Student Number'}
                        </Typography>
                        <Typography sx={{ fontSize: '13px', color: '#111827', fontWeight: 600 }}>{methods.getValues('student_number')}</Typography>
                      </Grid>
                    )}
                    {methods.getValues('course') && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography sx={{ fontSize: '11px', color: '#6B7280', fontWeight: 500 }}>
                          {clientType === 'Faculty' ? 'Department' : 'Course / Program'}
                        </Typography>
                        <Typography sx={{ fontSize: '13px', color: '#111827', fontWeight: 600 }}>{methods.getValues('course')}</Typography>
                      </Grid>
                    )}
                  </>
                )}

                {clientType === 'Student' && methods.getValues('year_level') && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography sx={{ fontSize: '11px', color: '#6B7280', fontWeight: 500 }}>Year Level</Typography>
                    <Typography sx={{ fontSize: '13px', color: '#111827', fontWeight: 600 }}>{methods.getValues('year_level')}</Typography>
                  </Grid>
                )}
                {methods.getValues('contact_number') && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography sx={{ fontSize: '11px', color: '#6B7280', fontWeight: 500 }}>Contact Number</Typography>
                    <Typography sx={{ fontSize: '13px', color: '#111827', fontWeight: 600 }}>{methods.getValues('contact_number')}</Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}

        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 0, mt: 3, borderTop: '1px solid #E5E7EB', pt: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Button 
          variant="outlined" 
          onClick={handleCancelClick} 
          sx={{ 
            textTransform: 'none', 
            borderRadius: '6px', 
            borderColor: '#D1D5DB', 
            color: '#374151', 
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '13px',
            fontWeight: 600,
            height: '36px',
            '&:hover': {
              borderColor: '#B0B0B0',
              bgcolor: '#F9FAFB',
            }
          }}
        >
          Cancel
        </Button>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {currentStep > 1 && (
            <Button 
              variant="outlined" 
              onClick={() => setCurrentStep(prev => prev - 1)}
              sx={{ 
                textTransform: 'none', 
                borderRadius: '6px', 
                borderColor: '#D1D5DB', 
                color: '#374151', 
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '13px',
                fontWeight: 600,
                height: '36px',
                '&:hover': {
                  borderColor: '#B0B0B0',
                  bgcolor: '#F9FAFB',
                }
              }}
            >
              Back
            </Button>
          )}
          {currentStep < 4 ? (
            <Button 
              variant="contained" 
              onClick={handleNextClick}
              sx={{ 
                textTransform: 'none', 
                borderRadius: '6px', 
                bgcolor: '#580000', 
                color: '#FFFFFF', 
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '13px',
                fontWeight: 600,
                height: '36px',
                '&:hover': {
                  bgcolor: '#400000',
                }
              }}
            >
              Next
            </Button>
          ) : (
            <Button 
              variant="contained" 
              onClick={handleSubmit(onSubmit)}
              disabled={mutation.status === 'pending'}
              sx={{ 
                textTransform: 'none', 
                borderRadius: '6px', 
                bgcolor: '#580000', 
                color: '#FFFFFF', 
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '13px',
                fontWeight: 600,
                height: '36px',
                '&:hover': {
                  bgcolor: '#400000',
                }
              }}
            >
              {mutation.status === 'pending' ? 'Saving…' : 'Submit Transaction'}
            </Button>
          )}
        </Box>
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
