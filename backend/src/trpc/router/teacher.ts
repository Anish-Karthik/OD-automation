import { Department, Prisma, Student, Teacher } from "@prisma/client";
import { z } from "zod";
import { db } from "../../lib/auth";
import { adminProcedure, router } from "../index";
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

type FullTeacher =
  | (Teacher & {
      tutorOf: (Student & {
        department: Department | null;
      })[];
      yearInChargeOf: (Student & {
        department: Department | null;
      })[];
      hodOf: Department | null;
    })
  | null;

const teacherInclude: Prisma.TeacherInclude = {
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
};

export const teacherRouter = router({
  form: teacherFormRouter,
  get: adminProcedure.input(z.string()).query(async ({ input: id }) => {
    return await db.teacher.findUnique({
      where: { id },
    });
  }),

  list: adminProcedure.query(async () => {
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
        console.log("Student for TUTOR role:", student);
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
        console.log("Student for YEAR_IN_CHARGE role:", student);
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
          console.log("Count of students for HOD:", cnt);
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

  create: adminProcedure
    .input(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email address"),
      })
    )
    .mutation(async ({ input }) => {
      console.log("Creating teacher:", input);
      const result = await db.user.upsert({
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
      console.log("Teacher created:", result);
      return result;
    }),

  createMany: adminProcedure
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
      console.log("Creating multiple teachers:", input);
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
      const result = await Promise.all(upsertPromises);
      console.log("Multiple teachers created:", result);
      return result;
    }),

  getFilteredRequests: adminProcedure
    .input(
      z.object({
        filters: z.custom<Partial<Teacher>>().optional(),
      })
    )
    .query(async ({ input: { filters } }) => {
      console.log("Getting filtered requests with filters:", filters);
      const where: Prisma.StudentWhereInput = {};

      const result = await db.teacher.findMany({});
      console.log("Filtered requests result:", result);
      return result;
    }),

  assignRole: adminProcedure
    .input(TeacherSchema)
    .mutation(async ({ input }) => {
      console.log("Assigning role:", input);
      const teacher = (await db.teacher.findUnique({
        where: { id: input.teacherId },
        include: teacherInclude,
      })) as FullTeacher;
      console.log("Current teacher data:", teacher);

      const currentRole = getTeacherRole(teacher);
      console.log("Current role:", currentRole);
      const anotherTeacher = await checkIfAnotherTeacherExistsWithSameCriteria(
        input
      );
      console.log("Another teacher with same criteria:", anotherTeacher);
      if (anotherTeacher) {
        const anotherTeacherRole = getTeacherRole(anotherTeacher);
        if (anotherTeacherRole) {
          await handleUnassign(anotherTeacherRole);
        }
      }
      if (currentRole) {
        await handleUnassign(currentRole);
      }

      if (input.role === "HOD") {
        const result = await db.teacher.update({
          where: { id: input.teacherId },
          data: {
            departmentId: input.departmentId,
          },
        });
        console.log("Updated HOD:", result);
        return result;
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
      console.log("Students found:", students);

      if (students.length === 0) {
        throw new Error("No students found with the given criteria");
      }

      if (input.role === "TUTOR") {
        const result = await db.teacher.update({
          where: { id: input.teacherId },
          data: {
            tutorOf: {
              connect: students.map((student) => ({ id: student.id })),
            },
          },
        });
        console.log("Updated TUTOR:", result);
        return result;
      }

      if (input.role === "YEAR_IN_CHARGE") {
        const result = await db.teacher.update({
          where: { id: input.teacherId },
          data: {
            yearInChargeOf: {
              connect: students.map((student) => ({ id: student.id })),
            },
          },
        });
        console.log("Updated YEAR_IN_CHARGE:", result);
        return result;
      }

      throw new Error("Invalid role");
    }),
});

async function handleUnassign(input: TeacherComplexType) {
  console.log("Unassigning role:", input);
  if (input.role === "HOD") {
    const result = await db.teacher.update({
      where: { id: input.teacherId },
      data: {
        departmentId: null,
      },
    });
    console.log("Unassigned HOD:", result);
    return result;
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
  console.log("Students found for unassigning:", students);

  if (students.length === 0) {
    throw new Error("No students found with the given criteria");
  }

  if (input.role === "TUTOR") {
    const result = await db.teacher.update({
      where: { id: input.teacherId },
      data: {
        tutorOf: {
          disconnect: students.map((student) => ({ id: student.id })),
        },
      },
    });
    console.log("Unassigned TUTOR:", result);
    return result;
  }

  if (input.role === "YEAR_IN_CHARGE") {
    const result = await db.teacher.update({
      where: { id: input.teacherId },
      data: {
        yearInChargeOf: {
          disconnect: students.map((student) => ({ id: student.id })),
        },
      },
    });
    console.log("Unassigned YEAR_IN_CHARGE:", result);
    return result;
  }

  throw new Error("Invalid role");
}

function getTeacherRole(teacher: FullTeacher): TeacherComplexType | null {
  if (!teacher) {
    return null;
  }
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
      departmentId: student.department!.id,
      batch: student.batch!,
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
      departmentId: student.department!.id,
      batch: student.batch!,
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
): Promise<FullTeacher | null> {
  console.log("Checking if another teacher exists with same criteria:", input);
  if (input === null) {
    return null;
  }
  if (input.role === "HOD") {
    const teacher = await db.teacher.findFirst({
      where: {
        id: {
          not: input.teacherId,
        },
        hodOf: {
          id: input.departmentId,
        },
      },
      include: teacherInclude,
    });
    console.log("Another HOD found:", teacher);
    return teacher as FullTeacher;
  }
  const studentsWhere: Prisma.StudentWhereInput = {
    departmentId: input.departmentId,
    batch: input.batch,
    year: Number(input.year),
    semester: Number(input.semester),
  };
  if (input.role === "TUTOR") {
    studentsWhere.section = input.section;
    studentsWhere.rollno = {
      gte: input.startRollNo,
      lte: input.endRollNo,
    };
  }
  console.log("Students where:", studentsWhere);
  let students: Student[] = [];
  // try {
    students = await db.student.findMany({
      where: studentsWhere,
    });
  // } catch (error) {
  //   console.log("Error:", error);
  //   throw error;
  // }
  console.log("Students found for checking:", students);
  if (students.length === 0) {
    return null;
  }
  if (input.role === "TUTOR") {
    console.log("Checking for TUTOR role");
    const teacher = await db.teacher.findFirst({
      where: {
        id: {
          not: input.teacherId,
        },
        tutorOf: {
          some: {
            id: {
              in: students.map((student) => student.id),
            },
          },
        },
      },
      include: teacherInclude,
    });
    console.log("Another TUTOR found:", teacher);
    return teacher as FullTeacher;
  }

  if (input.role === "YEAR_IN_CHARGE") {
    const teacher = await db.teacher.findFirst({
      where: {
        id: {
          not: input.teacherId,
        },
        yearInChargeOf: {
          some: {
            id: {
              in: students.map((student) => student.id),
            },
          },
        },
      },
      include: teacherInclude,
    });
    console.log("Another YEAR_IN_CHARGE found:", teacher);
    return teacher as FullTeacher;
  }

  return null;
}
