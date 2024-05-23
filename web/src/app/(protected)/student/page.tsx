"use client";
import { logout } from "@/shared/actions";
import React from "react";
import { useCurrentUser, useDurationDetails } from "@/shared/hooks";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { formSchema } from "@/schemas/form";
import { formatDate } from "date-fns";
import { PrismaTypes } from "../../../../../backend/src";

const position = ["Tutor", "Year In Charge", "HOD"];
const Dashboard = () => {
  const utils = trpc.useUtils();
  const durationState = useDurationDetails();
  const { user, fetching } = useCurrentUser();
  const [currDate, setCurrentDate] = React.useState<string>("");
  const { data: forms } = trpc.user.student.form.list.useQuery(user?.id || "");
  const createApplication = trpc.user.student.form.create.useMutation({
    onSuccess: () => {
      utils.user.student.form.list.cancel();
      utils.user.student.form.list.invalidate();
    },
  });
  const router = useRouter();
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "",
      reason: "",
      formType: "ON_DUTY",
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await createApplication.mutateAsync({
        ...values,
        requesterId: user?.id || "",
        dates: durationState.dates,
      });
      toast.success("Application created");
    } catch (error) {
      console.log(error);
      toast.error("Error creating application");
    }
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values);
  }
  if (fetching) {
    return <div>Loading...</div>;
  }
  if (!user) {
    router.push("/auth/login");
    return <div> Unauthenticated </div>;
  }
  if (user.role !== "STUDENT") {
    logout().then(() => {
      router.push("/auth/login");
    });

    return <div> Unauthorized </div>;
  }
  return (
    <div>
      <h1>Dashboard</h1>
      <h2>Welcome {user.name}</h2>
      <Dialog>
        <DialogTrigger>Add Application</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove your data from our servers.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="shadcn" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter the category of the form
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Input placeholder="shadcn" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter the reason for the form
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="formType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Form Type</FormLabel>
                    <FormControl>
                      <Input placeholder="shadcn" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter the type of the form
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-col gap-1">
                <div className="flex gap-2">
                  <Input
                    placeholder="date"
                    type="date"
                    value={currDate}
                    onChange={(e) => setCurrentDate(e.target.value)}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      durationState.addDate(currDate);
                      setCurrentDate("");
                    }}
                  >
                    Add Date
                  </Button>
                </div>
                <div className="flex w-full flex-wrap gap-2">
                  {durationState.dates.map((date) => (
                    <div
                      key={date}
                      onClick={() => {
                        durationState.removeDate(date);
                      }}
                      className="bg-gray-200 hover:bg-red-500 p-2 rounded-md"
                    >
                      <p>{date}</p>
                    </div>
                  ))}
                </div>
              </div>
              <DialogClose asChild>
                <Button type="submit">Submit</Button>
              </DialogClose>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {forms?.map((application) => (
        <div key={application.id}>
          <p>Requests: {application.requests.length}</p>
          <p>{application.category}</p>
          <p>{application.reason}</p>
          <p>{application.formType}</p>
          <p>
            {application.dates.map((d) => formatDate(d, "dd-MM-yy")).join(", ")}
          </p>
          {application.requests.map((request, ind) => (
            <div key={request.id} className="flex gap-1">
              <p>{ind + 1}</p>
              <p>{request.status}</p>
              <p>{request.requested.name}</p>
              <p>{position[ind]}</p>
            </div>
          ))}
          {application.requests.find(
            (request) => request.status === "REJECTED"
          ) ? (
            <div>OD Rejected</div>
          ) : application.requests.find(
              (request) => request.status === "PENDING"
            ) ? (
            <div>OD Pending</div>
          ) : application.requests.every(
              (request) => request.status === "ACCEPTED"
            ) ? (
            <div>OD Accepted</div>
          ) : null}
        </div>
      ))}
    </div>
  );
};

export default Dashboard;
