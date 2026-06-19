import { createContext, useContext, useMemo, useEffect, type ReactNode } from 'react'
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Service } from '@/types'
import { getServiceConfigByName, type ServiceConfig } from '@/config/serviceConfig'
import { baseFormSchema, studentNumberRegex, contactNumberRegex, type TransactionFormValues } from './transactionTypes'

interface TransactionFormContextValue {
  methods: UseFormReturn<TransactionFormValues>
  selectedService?: Service
  selectedServiceConfig?: ServiceConfig
}

const TransactionFormContext = createContext<TransactionFormContextValue | null>(null)

interface TransactionFormProviderProps {
  services: Service[]
  defaultValues: TransactionFormValues
  open: boolean
  children: ReactNode
}

function buildServiceSpecificSchema(serviceConfig?: ServiceConfig) {
  if (!serviceConfig) {
    return z.any().optional()
  }

  if (serviceConfig.key === 'EMERGENCY_WITH_REFERRAL') {
    return z.object({
      referralSourceType: z.string().trim().min(1, 'Referral source type is required'),
      hospitalOrSignatoryName: z.string().optional(),
      referralDateTime: z.string().optional(),
      verificationCode: z.string().optional(),
      emergencyLevel: z.string().trim().min(1, 'Emergency level is required'),
      conditionDescription: z.string().trim().min(1, 'Condition description is required'),
      referredBy: z.string().trim().min(1, 'Referred by is required'),
    }).superRefine((data: any, ctx: z.RefinementCtx) => {
      if (data.referralSourceType === 'Hospital/Clinic' || data.referralSourceType === 'Signed Physical Document') {
        if (!data.hospitalOrSignatoryName?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Hospital/Signatory name is required',
            path: ['hospitalOrSignatoryName'],
          })
        }
        if (!data.referralDateTime?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Date and time of referral is required',
            path: ['referralDateTime'],
          })
        }
      }
      if (data.referralSourceType === 'Digital Receipt/Code') {
        if (!data.verificationCode?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Verification code / reference number is required',
            path: ['verificationCode'],
          })
        }
      }
    })
  }

  const fields: Record<string, z.ZodTypeAny> = {}

  serviceConfig.fields.forEach((field) => {
    switch (field.type) {
      case 'text':
      case 'textarea':
      case 'date':
        fields[field.name] = field.required
          ? z.string().trim().min(1, `${field.label} is required`)
          : z.string()
        break
      case 'number': {
        const numberSchema = z.preprocess((value) => {
          if (typeof value === 'string' && value.trim() === '') return undefined
          if (typeof value === 'string') return Number(value)
          return value
        }, z.number())

        fields[field.name] = field.required
          ? numberSchema.refine((value) => typeof value === 'number' && !Number.isNaN(value), {
              message: `${field.label} is required`,
            })
          : numberSchema.optional()
        break
      }
      case 'select':
        fields[field.name] = field.required
          ? z.string().trim().min(1, `${field.label} is required`)
          : z.string()
        break
      default:
        fields[field.name] = z.string()
    }
  })

  if (serviceConfig.documentation?.length) {
    const documentaryShape: Record<string, z.ZodTypeAny> = {}
    serviceConfig.documentation.forEach((item) => {
      documentaryShape[item.name] = z.boolean().refine((value) => value === true, `${item.label} is required`)
    })

    fields.documentaryCompliance = z.object(documentaryShape)
  }

  return z.object(fields)
}

function getValidationSchema(serviceConfig?: ServiceConfig, clientType?: string): z.ZodType<TransactionFormValues, any, any> {
  const schema = baseFormSchema.extend({
    service_specific_data: buildServiceSpecificSchema(serviceConfig),
  })

  return schema.superRefine((data: any, ctx: z.RefinementCtx) => {
    // Student Type Validations
    if (clientType === 'Student') {
      if (!data.student_number?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Student number is required',
          path: ['student_number'],
        })
      } else if (!studentNumberRegex.test(data.student_number.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Student number must follow YYYY-XXXXX-CM-0',
          path: ['student_number'],
        })
      }

      if (!data.course?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Course / Program is required',
          path: ['course'],
        })
      }

      if (!data.year_level?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Year level is required',
          path: ['year_level'],
        })
      }

      if (!data.contact_number?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Contact number is required',
          path: ['contact_number'],
        })
      } else if (!contactNumberRegex.test(data.contact_number.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Contact number must be 09XXXXXXXXX',
          path: ['contact_number'],
        })
      }
    }

    // Organization Inside the PUP QC Campus Type Validations
    if (clientType === 'Organization Inside the PUP QC Campus') {
      if (!data.organization?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Organization name is required',
          path: ['organization'],
        })
      }

      if (!data.contact_number?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Contact number is required',
          path: ['contact_number'],
        })
      } else if (!contactNumberRegex.test(data.contact_number.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Contact number must be 09XXXXXXXXX',
          path: ['contact_number'],
        })
      }
    }

    // Visitor Type Validations
    if (clientType === 'Visitor') {
      if (data.contact_number?.trim() && !contactNumberRegex.test(data.contact_number.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Contact number must be 09XXXXXXXXX',
          path: ['contact_number'],
        })
      }
    }

    // Alumni / Faculty / Other Type Validations
    if (clientType !== 'Student' && clientType !== 'Organization Inside the PUP QC Campus' && clientType !== 'Visitor') {
      if (!data.contact_number?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Contact number is required',
          path: ['contact_number'],
        })
      } else if (!contactNumberRegex.test(data.contact_number.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Contact number must be 09XXXXXXXXX',
          path: ['contact_number'],
        })
      }
    }
  }) as unknown as z.ZodType<TransactionFormValues, any, any>
}

export function TransactionFormProvider({ services, defaultValues, open, children }: TransactionFormProviderProps) {
  const methods = useForm<TransactionFormValues>({
    defaultValues,
    mode: 'all',
    shouldUnregister: false,
    resolver: async (values, context, options) => {
      const serviceId = values.service_id
      const selectedService = services.find((service) => service.id === serviceId)
      const selectedServiceConfig = selectedService ? getServiceConfigByName(selectedService.name) : undefined
      const schema = getValidationSchema(selectedServiceConfig, values.client_type)
      return zodResolver(schema)(values, context, options)
    },
  })

  const serviceId = methods.watch('service_id')

  const selectedService = useMemo(
    () => services.find((service) => service.id === serviceId),
    [serviceId, services],
  )

  const selectedServiceConfig = useMemo(
    () => selectedService ? getServiceConfigByName(selectedService.name) : undefined,
    [selectedService],
  )

  useEffect(() => {
    if (!open) {
      methods.reset(defaultValues)
    }
  }, [defaultValues, methods, open])

  return (
    <TransactionFormContext.Provider value={{ methods, selectedService, selectedServiceConfig }}>
      <FormProvider {...methods}>{children}</FormProvider>
    </TransactionFormContext.Provider>
  )
}

export function useTransactionForm() {
  const context = useContext(TransactionFormContext)
  if (!context) {
    throw new Error('useTransactionForm must be used within a TransactionFormProvider')
  }
  return context
}
