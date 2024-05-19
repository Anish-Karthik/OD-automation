"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PrismaTypes } from "@/types";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { UploadButton, UploadDropzone } from "@/lib/uploadthing";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export function CollegeDetailsForm({
  college,
}: {
  college?: PrismaTypes.College;
}) {
  const collegeSchema = z.object({
    name: z.string().min(2, {
      message: "department name is required",
    }),
    district: z.string().min(2, {
      message: "District is required",
    }),
    description: z.string().min(2, {
      message: "Description is required",
    }),
  });
  const form = useForm<z.infer<typeof collegeSchema>>({
    resolver: zodResolver(collegeSchema),
    defaultValues: {
      name: "",
      district: "",
      description: "",
    },
  });
  const onSubmit = (data: z.infer<typeof collegeSchema>) => {
    console.log(data);
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>College Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Deptname" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="district"
          render={({ field }) => (
            <FormItem>
              <FormLabel>District</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Deptname" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>College Description</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Deptname" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
