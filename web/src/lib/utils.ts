import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { UseFormReturn } from "react-hook-form";
import { inputExcelFormSchema, studentSchema } from "@/schemas/student";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { z } from "zod";
import { formatDate } from "date-fns";

export const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const exportToPdf = () => {
  const canvas = document.getElementById("preview");

  if (!canvas) return;

  // use jspdf
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "px",
    format: "a4",
  });

  // download the pdf
  doc.save("canvas.pdf");
};

export const readExcel = (
  file: File | null,
  form: UseFormReturn<z.infer<typeof inputExcelFormSchema>, any, undefined>,
  setStrength: (strength: number) => void
) => {
  console.log(file);
  if (!file) {
    return;
  }
  const promise = new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.readAsArrayBuffer(file);
    fileReader.onload = (e: any) => {
      if (!e && !e.target && !e.target.result) {
        throw new Error("File not found");
      }
      const bufferArray = e.target.result;
      const wb = XLSX.read(bufferArray, { type: "buffer" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      console.log(data);
      resolve(data);
    };
    fileReader.onerror = (error) => {
      console.log(error);
      reject(error);
    };
  });
  promise.then((d) => {
    console.log(d);
    const data = dataWrangleTheExcelData(d);
    console.log(data);
    setStrength(data?.length || 0);
    form.setValue("studentData", data);
    form.setValue("strength", data.length);
    form.setValue("filename", file.name);
  });
};
export function dataWrangleTheExcelData(data: any) {
  console.log(data);
  try {
    // format it into student data, remove the data that does fit under that category
    // input data is an array of objects containing the data from the excel sheet
    // remove the rows that don't match the format slno, regno, name, rollno, section
    const studentData: z.infer<typeof studentSchema>[] = [];
    const invalidRows: any[] = [];
    let i = 1;
    data.forEach((row: any, index: number) => {
      console.log(row);
      if (
        row.__EMPTY &&
        row.__EMPTY_1 &&
        row.__EMPTY_2 &&
        row.__EMPTY_3 &&
        !isNaN(parseInt(row.__EMPTY_1))
      ) {
        try {
          const student: z.infer<typeof studentSchema> = {
            name: (row.__EMPTY_2 || row.name) as string,
            regno: String(row.__EMPTY_1 || row.regno) as string,
            rollno: (row.__EMPTY || row.rollno) as number,
            section: (row.__EMPTY_3 || row.section) as string,
            vertical: row.__EMPTY_4 || row.vertical || "none",
          };
          studentData.push(student);
        } catch (error) {
          invalidRows.push(row);
        }
      }
      if (row.name && row.regno && row.rollno && row.section) {
        try {
          const student: z.infer<typeof studentSchema> = {
            name: row.name as string,
            regno: String(row.regno),
            rollno: Number(row.rollno),
            section: row.section as string,
            vertical: row?.vertical || "none",
          };
          studentData.push(student);
        } catch (error) {
          invalidRows.push(row);
        }
      }
    });
    console.log(studentData);
    return studentData;
  } catch (error) {
    console.log(error);
    return [];
  }
}

export function yearFromStartYear(startYear: number): 1 | 2 | 3 | 4 {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const currentStartYear = currentMonth >= 6 ? currentYear : currentYear - 1;

  return Math.max(1, Math.min(4, currentStartYear - startYear + 1)) as
    | 1
    | 2
    | 3
    | 4;
}

export function extractRollNo(rollno: string) {
  // 21CSXX
  const startYear = parseInt(rollno.slice(0, 2));
  const dept = rollno.slice(2, rollno.length - 3);
  const rno = parseInt(rollno.slice(rollno.length - 3));
  const year = yearFromStartYear(startYear);

  return { year, dept, rno };
}

export function exportHTMLTableToExcel(
  type: XLSX.BookType,
  tableId: string,
  fileName: string,
  isBase64: boolean = false
): File | null | string {
  console.log("exporting");
  var tableElement = document.getElementById(tableId);
  if (null == tableElement) return null;
  var workBook = XLSX.utils.table_to_book(tableElement, { sheet: "skills" });
  return isBase64
    ? XLSX.write(workBook, { bookType: type, bookSST: true, type: "base64" })
    : XLSX.writeFile(workBook, (fileName || "Skills") + "." + (type || "xlsx"));
}

export const getStartDate = (dates: Date[]): Date => {
  return dates.reduce((a, b) => (a < b ? a : b));
};
export const getEndDate = (dates: Date[]): Date => {
  return dates.reduce((a, b) => (a > b ? a : b));
};
export const getStartAndEndDate = (dates: Date[]): [Date, Date] => {
  return [getStartDate(dates), getEndDate(dates)];
};
export const getFormatedStartAndEndDate = (dates: Date[]): [string, string] => {
  return [
    formatDate(getStartDate(dates), "dd/MM/yy"),
    formatDate(getEndDate(dates), "dd/MM/yy"),
  ];
};
