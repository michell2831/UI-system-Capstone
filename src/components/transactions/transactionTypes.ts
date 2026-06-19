import { z } from 'zod'

export interface DocumentaryChecklistValue {
  studentID?: boolean
  enrollmentForm?: boolean
  clearance?: boolean
}

export interface ServiceSpecificData {
  documentaryCompliance?: DocumentaryChecklistValue
  [key: string]: unknown
}

export const studentNumberRegex = /^\d{4}-\d{5}-CM-0$/
export const contactNumberRegex = /^(?:\+63\d{10}|09\d{9})$/

export const baseFormSchema = z.object({
  service_id: z.string().min(1, 'Service is required'),
  assigned_to: z.string(),
  client_type: z.enum(['Student', 'Organization Inside the PUP QC Campus', 'Visitor', 'Alumni', 'Faculty']),
  client_name: z.string().optional(),
  client_first_name: z.string().trim().min(1, 'First name is required'),
  client_middle_name: z.string().optional(),
  client_surname: z.string().trim().min(1, 'Surname is required'),
  student_number: z.string().optional(),
  course: z.string().optional(),
  year_level: z.string().optional(),
  contact_number: z.string().optional(),
  organization: z.string().optional(),
  org_level: z.string().optional(),
  remarks: z.string().max(255, 'Remarks cannot exceed 255 characters'),
  service_specific_data: z.any().optional(),
})

export type TransactionFormValues = z.infer<typeof baseFormSchema>

