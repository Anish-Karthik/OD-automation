"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { PrismaTypes } from "@/types";
import { useForm } from "react-hook-form"
import toast from "react-hot-toast"
import { z } from "zod"

import { capitalize } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DialogClose } from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { trpc } from "@/lib/trpc"

const deptSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "department name is required",
    })
    .refine((d) => {
      // only A-z and spaces are allowed
      return /^[a-zA-Z\s]*$/.test(d)
    }),
  code: z
    .string()
    .min(2, {
      message: "department code is required",
    })
    .toUpperCase()
    .refine((d) => {
      // only A-Z are allowed
      return /^[A-Z]*$/.test(d)
    }),
})
export function DepartmentForm({ department }: { department?: PrismaTypes.Department }) {
  const utils = trpc.useUtils()
  const create = trpc.department.create.useMutation({
    onSuccess: (data) => {
      toast.success("Department created")
      utils.department.getAll.cancel()
      utils.department.getAll.setData(undefined, (prev) => {
        return prev ? [...prev, data] : [data]
      })
    },
  })
  const update = trpc.department.update.useMutation({
    onSuccess: (data) => {
      toast.success("Departments updated")
      utils.department.getAll.cancel()
      utils.department.getAll.setData(undefined, (prev) => {
        return prev
          ? prev.map((dept) => {
              return dept.id === data.id ? data : dept
            })
          : [data]
      })
    },
  })
  const form = useForm<z.infer<typeof deptSchema>>({
    resolver: zodResolver(deptSchema),
    defaultValues: {
      name: department?.name || "",
      code: department?.code || "",
    },
    mode: "onChange",
  })
  const { isValid, isSubmitting } = form.formState

  const onSubmit = async (data: z.infer<typeof deptSchema>) => {
    try {
      const name = data.name
        .split(" ")
        .filter((word) => {
          return word.length > 0 && word !== " "
        })
        .map((word) =>
          ["And", "and"].includes(word) ? "and" : capitalize(word)
        )
        .join(" ")
      if (department) {
        await update.mutateAsync({
          id: department.id,
          name,
          code: data.code,
        })
      } else {
        await create.mutateAsync({
          name,
          code: data.code,
        })
      }
    } catch (error) {
      toast.error("Something went wrong")
    }
  }
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  autoComplete="off"
                  {...field}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value
                        .split(" ")
                        .map((word) =>
                          ["And", "and"].includes(word)
                            ? "and"
                            : capitalize(word)
                        )
                        .join(" ")
                    )
                  }
                  placeholder="Deptname"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code</FormLabel>
              <FormControl>
                <Input
                  autoComplete="off"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  placeholder="Deptname"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isValid ? (
          <Button type="submit">Submit</Button>
        ) : (
          <DialogClose asChild>
            <Button type="submit">Submit</Button>
          </DialogClose>
        )}
      </form>
    </Form>
  )
}
