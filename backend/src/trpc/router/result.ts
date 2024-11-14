import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminProcedure, router } from "..";
import { db } from "../../lib/auth";


interface GradeWithRelations {
  student: {
    batch: string | null;
  } | null;
  subject: {
    semester: string;
  } | null;
}

interface SemesterUpload {
  batchYear: string;
  semester: string;
}

export const resultRouter = router({
  getSemesterUploads: adminProcedure.query(async () => {
    // Get all grades with related subject and student info
    const grades = await db.grade.findMany({
      include: {
        student: {
          select: {
            batch: true,
          }
        },
        subject: {
          select: {
            semester: true,
          }
        },
      },
      orderBy: [
        {
          student: {
            batch: 'desc'
          }
        }
      ]
    });

    // Create a Set to track unique semester-batch combinations
    const uniqueUploads = new Set<string>();
    
    // Filter and transform the data
    const semesterUploads = grades.reduce((acc: SemesterUpload[], grade: GradeWithRelations) => {
      // Skip if student or subject is null
      if (!grade.student?.batch || !grade.subject?.semester) return acc;

      const key = `${grade.student.batch}-${grade.subject.semester}`;
      
      if (!uniqueUploads.has(key)) {
        uniqueUploads.add(key);
        acc.push({
          batchYear: grade.student.batch,
          semester: grade.subject.semester,
        });
      }
      
      return acc;
    }, []);

 
    return semesterUploads.sort((a: SemesterUpload, b: SemesterUpload) => {
      // First sort by batch year
      if (a.batchYear !== b.batchYear) {
        return b.batchYear.localeCompare(a.batchYear);
      }
      // Then by semester
      return parseInt(a.semester) - parseInt(b.semester);
    });
  }),
});
