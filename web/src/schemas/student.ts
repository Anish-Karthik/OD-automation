import { z } from "zod"

export const studentSchema = z.object({
  name: z.string(),
  rollno: z.number(),
  section: z.string(),
  regno: z.string(),
  vertical: z.string(),
})

export const studentAttributes = z.object({
  year: z.number().refine(
    (data) => {
      return data >= 1 && data <= 4
    },
    { message: "must be a number" }
  ),
  semester: z.number().refine(
    (data) => {
      return data >= 1 && data <= 8
    },
    { message: "must be a number" }
  ),
  departmentId: z.string(),
})

export const singleStudentSchema = studentSchema.merge(studentAttributes)

export const excelFormSchema = z
  .object({
    studentData: z.array(studentSchema),
    strength: z.number(),
  })
  .merge(studentAttributes)

export const inputExcelFormSchema = z
  .object({
    filename: z.string().min(1, { message: "please upload a file" }),
  })
  .merge(excelFormSchema)
