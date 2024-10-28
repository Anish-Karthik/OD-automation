import { Department, Prisma, Teacher } from "@prisma/client";
import { z } from "zod";
import { db } from "../../lib/auth";
import { publicProcedure, router, protectedProcedure } from "../index";
import { teacherFormRouter } from "./teacher-form";

const compareRoles = (a: string | null, b: string | null) => {
  if (a === "HOD") {
    return -1;
  }
  if (b === "HOD") {
    return 1;
  }
  if (a === "YEAR_IN_CHARGE") {
    return -1;
  }
  if (b === "YEAR_IN_CHARGE") {
    return 1;
  }
  if (a === "TUTOR") {
    return -1;
  }
  if (b === "TUTOR") {
    return 1;
  }
  return 0;
};

const TutorSchema = z.object({
  role: z.literal("TUTOR"),
  teacherId: z.string().min(1, "Teacher is required"),
  departmentId: z.string().min(1, "Department is required"),
  batch: z.string().min(1, "Batch is required"),
  year: z.union([z.enum(["1", "2", "3", "4"]), z.string().regex(/^[5-6]$/)]),
  semester: z.enum(["1", "2", "3", "4", "5", "6", "7", "8"]),
  section: z.union([
    z.enum(["A", "B", "C", "D"]),
    z.string().min(1, "Section is required"),
  ]),
  startRollNo: z.number().min(1, "Start Roll No is required"),
  endRollNo: z.number().min(1, "End Roll No is required"),
});

const YearInChargeSchema = z.object({
  role: z.literal("YEAR_IN_CHARGE"),
  teacherId: z.string().min(1, "Teacher is required"),
  departmentId: z.string().min(1, "Department is required"),
  batch: z.string().min(1, "Batch is required"),
  year: z.union([z.enum(["1", "2", "3", "4"]), z.string().regex(/^[5-6]$/)]),
  semester: z.enum(["1", "2", "3", "4", "5", "6", "7", "8"]),
});

const HodSchema = z.object({
  role: z.literal("HOD"),
  teacherId: z.string().min(1, "Teacher is required"),
  departmentId: z.string().min(1, "Department is required"),
});

const TeacherSchema = z.discriminatedUnion("role", [
  TutorSchema,
  YearInChargeSchema,
  HodSchema,
]);

type TeacherComplexType = z.infer<typeof TeacherSchema>;

export const teacherRouter = router({
  form: teacherFormRouter,
  get: publicProcedure.input(z.string()).query(async ({ input: id }) => {
    return await db.teacher.findUnique({
      where: { id },
    });
  }),
  list: publicProcedure.query(async () => {
    const teachers: {
      userId: string;
      id: string;
      name: string;
      email: string;
      role: "TUTOR" | "YEAR_IN_CHARGE" | "HOD" | null;
      assignedTo: string | null;
      countOfStudents: number | null;
    }[] = [];
    const allTeachers = await db.teacher.findMany({
      include: {
        user: true,
        tutorOf: {
          include: {
            department: true,
          },
        },
        yearInChargeOf: {
          include: {
            department: true,
          },
        },
        hodOf: true,
      },
    });
    allTeachers.forEach((teacher) => {
      const extraData: {
        assignedTo: string | null;
        countOfStudents: number;
        role: "TUTOR" | "YEAR_IN_CHARGE" | "HOD" | null;
      } = {
        assignedTo: null,
        countOfStudents: 0,
        role: null,
      };
      if (teacher.tutorOf.length > 0) {
        const student = teacher.tutorOf[0];
        console.log(student);
        const startingRollNo = teacher.tutorOf.reduce(
          (acc, student) => Math.min(acc, student.rollno),
          Number.MAX_SAFE_INTEGER
        );
        const endingRollNo = teacher.tutorOf.reduce(
          (acc, student) => Math.max(acc, student.rollno),
          Number.MIN_SAFE_INTEGER
        );
        extraData.assignedTo = `${student.department!.code}-${student.batch}-${
          student.year
        }-${student.semester}-${
          student.section
        }-${startingRollNo}-${endingRollNo}`;
        extraData.countOfStudents = teacher.tutorOf.length;
        extraData.role = "TUTOR";
      }
      if (teacher.yearInChargeOf.length > 0) {
        const student = teacher.yearInChargeOf[0];
        extraData.assignedTo = `${student.department!.code}-${student.batch}-${
          student.year
        }-${student.semester}`;
        extraData.countOfStudents = teacher.yearInChargeOf.length;
        extraData.role = "YEAR_IN_CHARGE";
      }
      if (!teacher.hodOf) {
        teachers.push({
          id: teacher.id,
          name: teacher.user.name!,
          email: teacher.user.email!,
          userId: teacher.user.id,
          ...extraData,
        });
      }
    });

    await Promise.all(
      allTeachers
        .filter((teacher) => teacher.hodOf)
        .map(async (teacher) => {
          const cnt = await db.student.count({
            where: {
              departmentId: teacher.hodOf!.id,
            },
          });
          teachers.push({
            id: teacher.id,
            name: teacher.user.name!,
            email: teacher.user.email!,
            role: "HOD",
            userId: teacher.user.id,
            assignedTo: teacher.hodOf!.code,
            countOfStudents: cnt,
          });
          return teacher;
        })
    );

    teachers.sort((a, b) => compareRoles(a.role, b.role));

    return teachers;
  }),

  create: publicProcedure
    .input(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email address"),
      })
    )
    .mutation(async ({ input }) => {
      return await db.user.upsert({
        where: { email: input.email },
        update: {
          name: input.name,
        },
        create: {
          role: "TEACHER",
          email: input.email,
          name: input.name,
          username: input.email,
          teacher: {
            create: {},
          },
        },
      });
    }),

  createMany: publicProcedure
    .input(
      z.array(
        z.object({
          id: z.string().optional(),
          name: z.string().min(1, "Name is required"),
          email: z.string().email("Invalid email address"),
        })
      )
    )
    .mutation(async ({ input }) => {
      const upsertPromises = input.map((teacher) =>
        db.user.upsert({
          where: { email: teacher.email },
          update: {
            name: teacher.name,
          },
          create: {
            role: "TEACHER",
            email: teacher.email,
            name: teacher.name,
            username: teacher.email,
            teacher: {
              create: {},
            },
          },
        })
      );
      return await Promise.all(upsertPromises);
    }),

  getFilteredRequests: publicProcedure
    .input(
      z.object({
        filters: z.custom<Partial<Teacher>>().optional(),
      })
    )
    .query(async ({ input: { filters } }) => {
      const where: Prisma.StudentWhereInput = {};

      return await db.teacher.findMany({});
    }),

  assignRole: publicProcedure
    .input(TeacherSchema)
    .mutation(async ({ input }) => {
      // Check if the teacher exists with role, if yes, unassign the role
      // Check if another teacher is assigned to the same role, if yes, unassign the role
      const teacher = await db.teacher.findUnique({
        where: { id: input.teacherId },
        include: {
          tutorOf: {
            include: {
              department: true,
            },
          },
          yearInChargeOf: {
            include: {
              department: true,
            },
          },
          hodOf: true,
        },
      });
      // get teacher's current role
      // @ts-ignore
      const currentRole = getTeacherRole(teacher);
      // check if another teacher exists with the same criteria
      if (currentRole) {
        await handleUnassign(input);
        const anotherTeacher =
          await checkIfAnotherTeacherExistsWithSameCriteria(currentRole);
        if (anotherTeacher) {
          await handleUnassign(currentRole);
        }
      }

      if (input.role === "HOD") {
        return await db.teacher.update({
          where: { id: input.teacherId },
          data: {
            departmentId: input.departmentId,
          },
        });
      }
      const studentsWhere: Prisma.StudentWhereInput = {
        departmentId: input.departmentId,
        batch: input.batch,
        year: Number.parseInt(input.year),
        semester: Number.parseInt(input.semester),
      };
      if (input.role === "TUTOR") {
        studentsWhere.section = input.section;
        studentsWhere.rollno = {
          gte: input.startRollNo,
          lte: input.endRollNo,
        };
      }
      const students = await db.student.findMany({
        where: studentsWhere,
      });

      if (students.length === 0) {
        throw new Error("No students found with the given criteria");
      }

      if (input.role === "TUTOR") {
        return await db.teacher.update({
          where: { id: input.teacherId },
          data: {
            tutorOf: {
              connect: students.map((student) => ({ id: student.id })),
            },
          },
        });
      }

      if (input.role === "YEAR_IN_CHARGE") {
        return await db.teacher.update({
          where: { id: input.teacherId },
          data: {
            yearInChargeOf: {
              connect: students.map((student) => ({ id: student.id })),
            },
          },
        });
      }

      throw new Error("Invalid role");
    }),
});

async function handleUnassign(input: TeacherComplexType) {
  if (input.role === "HOD") {
    return await db.teacher.update({
      where: { id: input.teacherId },
      data: {
        departmentId: null,
      },
    });
  }

  const studentsWhere: Prisma.StudentWhereInput = {
    departmentId: input.departmentId,
    batch: input.batch,
    year: Number.parseInt(input.year),
    semester: Number.parseInt(input.semester),
  };
  if (input.role === "TUTOR") {
    studentsWhere.section = input.section;
    studentsWhere.rollno = {
      gte: input.startRollNo,
      lte: input.endRollNo,
    };
  }
  const students = await db.student.findMany({
    where: studentsWhere,
  });

  if (students.length === 0) {
    throw new Error("No students found with the given criteria");
  }

  if (input.role === "TUTOR") {
    return await db.teacher.update({
      where: { id: input.teacherId },
      data: {
        tutorOf: {
          disconnect: students.map((student) => ({ id: student.id })),
        },
      },
    });
  }

  if (input.role === "YEAR_IN_CHARGE") {
    return await db.teacher.update({
      where: { id: input.teacherId },
      data: {
        yearInChargeOf: {
          disconnect: students.map((student) => ({ id: student.id })),
        },
      },
    });
  }

  throw new Error("Invalid role");
}

function getTeacherRole(
  teacher: Teacher & {
    tutorOf: {
      department: Department;
      batch: string;
      year: number;
      semester: number;
      section: string;
      rollno: number;
    }[];
    yearInChargeOf: {
      department: Department;
      batch: string;
      year: number;
      semester: number;
    }[];
    hodOf: Department | null;
  }
): TeacherComplexType | null {
  if (teacher.tutorOf.length > 0) {
    const student = teacher.tutorOf[0];
    const startingRollNo = teacher.tutorOf.reduce(
      (acc, student) => Math.min(acc, student.rollno),
      Number.MAX_SAFE_INTEGER
    );
    const endingRollNo = teacher.tutorOf.reduce(
      (acc, student) => Math.max(acc, student.rollno),
      Number.MIN_SAFE_INTEGER
    );
    return {
      role: "TUTOR",
      teacherId: teacher.id,
      departmentId: student.department.code,
      batch: student.batch,
      year: student.year.toString(),
      semester: student.semester as any,
      section: student.section,
      startRollNo: startingRollNo,
      endRollNo: endingRollNo,
    };
  }
  if (teacher.yearInChargeOf.length > 0) {
    const student = teacher.yearInChargeOf[0];
    return {
      role: "YEAR_IN_CHARGE",
      teacherId: teacher.id,
      departmentId: student.department.code,
      batch: student.batch,
      year: student.year.toString(),
      semester: student.semester as any,
    };
  }
  if (teacher.hodOf) {
    return {
      role: "HOD",
      teacherId: teacher.id,
      departmentId: teacher.hodOf.id,
    };
  }
  return null;
}

async function checkIfAnotherTeacherExistsWithSameCriteria(
  input: TeacherComplexType
) {
  if (input === null) {
    return;
  }
  if (input.role === "HOD") {
    const teacher = await db.teacher.findFirst({
      where: {
        hodOf: {
          id: input.departmentId,
        },
      },
    });
    return teacher;
  }
  const studentsWhere: Prisma.StudentWhereInput = {
    departmentId: input.departmentId,
    batch: input.batch,
    year: Number(input.year),
    semester: input.semester as any,
  };
  if (input.role === "TUTOR") {
    studentsWhere.section = input.section;
    studentsWhere.rollno = {
      gte: input.startRollNo,
      lte: input.endRollNo,
    };
  }
  const students = await db.student.findMany({
    where: studentsWhere,
  });
  if (students.length === 0) {
    return null;
  }
  if (input.role === "TUTOR") {
    const teacher = await db.teacher.findFirst({
      where: {
        tutorOf: {
          some: {
            id: {
              in: students.map((student) => student.id),
            },
          },
        },
      },
    });
    return teacher;
  }

  if (input.role === "YEAR_IN_CHARGE") {
    const teacher = await db.teacher.findFirst({
      where: {
        yearInChargeOf: {
          some: {
            id: {
              in: students.map((student) => student.id),
            },
          },
        },
      },
    });
    return teacher;
  }

  return null;
}
