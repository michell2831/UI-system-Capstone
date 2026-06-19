import { Controller, type Control } from 'react-hook-form'
import { useTransactionForm } from './TransactionFormProvider'
import { DocumentationChecklist } from './DocumentationChecklist'
import type { ServiceField } from '@/config/serviceConfig'
import type { TransactionFormValues } from './transactionTypes'
import { Box, TextField, Select, MenuItem, FormControl, InputLabel, FormHelperText, Grid } from '@mui/material'

function renderField(field: ServiceField, control: Control<TransactionFormValues>, errors: Record<string, unknown>) {
  const fieldName = `service_specific_data.${field.name}` as const
  const errorMessage = (errors?.[field.name] as { message?: string } | undefined)?.message

  if (field.type === 'textarea') {
    return (
      <Controller
        key={field.name}
        name={fieldName}
        control={control}
        defaultValue=""
        render={({ field: controllerField }) => (
          <TextField
            fullWidth
            multiline
            rows={3}
            label={`${field.label}${field.required ? ' *' : ''}`}
            value={controllerField.value}
            onChange={controllerField.onChange}
            placeholder={field.placeholder}
            error={Boolean(errorMessage)}
            helperText={errorMessage}
            sx={{ mb: 2 }}
          />
        )}
      />
    )
  }

  if (field.type === 'select') {
    return (
      <Controller
        key={field.name}
        name={fieldName}
        control={control}
        defaultValue=""
        render={({ field: controllerField }) => (
          <FormControl fullWidth error={Boolean(errorMessage)} sx={{ mb: 2 }}>
            <InputLabel>{`${field.label}${field.required ? ' *' : ''}`}</InputLabel>
            <Select
              value={controllerField.value}
              onChange={controllerField.onChange}
              label={`${field.label}${field.required ? ' *' : ''}`}
            >
              {field.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {errorMessage && <FormHelperText>{errorMessage}</FormHelperText>}
          </FormControl>
        )}
      />
    )
  }

  if (field.type === 'checkboxGroup') {
    return null
  }

  return (
    <Controller
      key={field.name}
      name={fieldName}
      control={control}
      defaultValue=""
      render={({ field: controllerField }) => (
        <TextField
          fullWidth
          type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
          label={`${field.label}${field.required ? ' *' : ''}`}
          value={controllerField.value}
          onChange={controllerField.onChange}
          placeholder={field.placeholder}
          error={Boolean(errorMessage)}
          helperText={errorMessage}
          slotProps={{ inputLabel: { shrink: field.type === 'date' ? true : undefined } }}
          sx={{ mb: 2 }}
        />
      )}
    />
  )
}

export function ServiceDynamicFields() {
  const { methods, selectedServiceConfig, selectedService } = useTransactionForm()
  const { control, formState } = methods
  const errors = (formState.errors.service_specific_data ?? {}) as Record<string, unknown>

  if (!selectedServiceConfig) {
    return (
      <Box sx={{ p: 2, borderRadius: '12px', border: '1px solid', borderColor: 'divider', bgcolor: 'rgba(0,0,0,0.02)', fontSize: '14px', color: 'text.secondary' }}>
        {selectedService
          ? `No custom fields configured for ${selectedService.name}. Please proceed with the standard client details.`
          : 'Select a service to reveal service-specific fields.'}
      </Box>
    )
  }

  if (selectedServiceConfig.key === 'EMERGENCY_WITH_REFERRAL') {
    const referralSourceType = methods.watch('service_specific_data.referralSourceType')

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Grid container spacing={2}>
          {/* Referral Source Type */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="service_specific_data.referralSourceType"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <FormControl fullWidth error={Boolean((errors?.referralSourceType as any)?.message)}>
                  <InputLabel>Referral Source Type *</InputLabel>
                  <Select value={field.value} onChange={field.onChange} label="Referral Source Type *">
                    <MenuItem value="Hospital/Clinic">Hospital/Clinic</MenuItem>
                    <MenuItem value="Signed Physical Document">Signed Physical Document</MenuItem>
                    <MenuItem value="Digital Receipt/Code">Digital Receipt/Code</MenuItem>
                  </Select>
                  {(errors?.referralSourceType as any)?.message && (
                    <FormHelperText>{(errors.referralSourceType as any).message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />
          </Grid>

          {/* Emergency Level */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="service_specific_data.emergencyLevel"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <FormControl fullWidth error={Boolean((errors?.emergencyLevel as any)?.message)}>
                  <InputLabel>Emergency Level *</InputLabel>
                  <Select value={field.value} onChange={field.onChange} label="Emergency Level *">
                    <MenuItem value="Minor">Minor</MenuItem>
                    <MenuItem value="Moderate">Moderate</MenuItem>
                    <MenuItem value="Major">Major</MenuItem>
                  </Select>
                  {(errors?.emergencyLevel as any)?.message && (
                    <FormHelperText>{(errors.emergencyLevel as any).message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />
          </Grid>
        </Grid>

        {/* Conditional inputs based on source type */}
        {(referralSourceType === 'Hospital/Clinic' || referralSourceType === 'Signed Physical Document') && (
          <Box sx={{ p: 2, borderRadius: '8px', border: '1px solid', borderColor: 'divider', bgcolor: 'rgba(0,0,0,0.01)' }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="service_specific_data.hospitalOrSignatoryName"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      fullWidth
                      label="Hospital / Signatory Name *"
                      placeholder="Enter hospital name or signatory"
                      value={field.value}
                      onChange={field.onChange}
                      error={Boolean((errors?.hospitalOrSignatoryName as any)?.message)}
                      helperText={(errors.hospitalOrSignatoryName as any)?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="service_specific_data.referralDateTime"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      fullWidth
                      type="datetime-local"
                      label="Date & Time of Referral *"
                      slotProps={{ inputLabel: { shrink: true } }}
                      value={field.value}
                      onChange={field.onChange}
                      error={Boolean((errors?.referralDateTime as any)?.message)}
                      helperText={(errors.referralDateTime as any)?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {referralSourceType === 'Digital Receipt/Code' && (
          <Box sx={{ p: 2, borderRadius: '8px', border: '1px solid', borderColor: 'divider', bgcolor: 'rgba(0,0,0,0.01)' }}>
            <Controller
              name="service_specific_data.verificationCode"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <TextField
                  fullWidth
                  label="Verification Code / Reference Number *"
                  placeholder="Enter verification code"
                  value={field.value}
                  onChange={field.onChange}
                  error={Boolean((errors?.verificationCode as any)?.message)}
                  helperText={(errors.verificationCode as any)?.message}
                />
              )}
            />
          </Box>
        )}

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            {/* Referred By */}
            <Controller
              name="service_specific_data.referredBy"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <TextField
                  fullWidth
                  label="Referred By *"
                  placeholder="Doctor or healthcare provider name"
                  value={field.value}
                  onChange={field.onChange}
                  error={Boolean((errors?.referredBy as any)?.message)}
                  helperText={(errors.referredBy as any)?.message}
                />
              )}
            />
          </Grid>
        </Grid>

        {/* Condition Description */}
        <Controller
          name="service_specific_data.conditionDescription"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Condition Description *"
              placeholder="Describe the clinical condition and reasons for referral…"
              value={field.value}
              onChange={field.onChange}
              error={Boolean((errors?.conditionDescription as any)?.message)}
              helperText={(errors.conditionDescription as any)?.message}
            />
          )}
        />

        {selectedServiceConfig.documentation ? (
          <DocumentationChecklist items={selectedServiceConfig.documentation} />
        ) : null}
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {selectedServiceConfig.fields.map((field) => renderField(field, control, errors))}
      {selectedServiceConfig.documentation ? (
        <DocumentationChecklist items={selectedServiceConfig.documentation} />
      ) : null}
    </Box>
  )
}
