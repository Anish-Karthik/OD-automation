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
  
  // Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "",
      reason: "",
      formType: "ON_DUTY",
    },
  });

  // Define a submit handler.
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
    console.log(values);
  }
  
  if (fetching) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    router.push("/auth/login");
    return <div>Unauthenticated</div>;
  }
  
  if (user.role !== "STUDENT") {
    logout().then(() => {
      router.push("/auth/login");
    });
    return <div>Unauthorized</div>;
  }
  
  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <h2 className="text-xl mb-6">Welcome, {user.name}</h2>

      <Dialog>
        <DialogTrigger asChild>
          <Button className="bg-blue-500 text-white hover:bg-blue-600">Add Application</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Add New Application</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Fill out the form below to submit a new application.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="Category" {...field} />
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
                      <Input placeholder="Reason" {...field} />
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
                      <Input placeholder="Form Type" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter the type of the form
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="bg-gray-100 p-4 rounded-lg border border-gray-300">
                <p className="font-semibold mb-2">Select Dates</p>
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Date"
                    type="date"
                    value={currDate}
                    onChange={(e) => setCurrentDate(e.target.value)}
                    className="w-1/2"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (currDate) {
                        durationState.addDate(currDate);
                        setCurrentDate("");
                      }
                    }}
                    className="bg-green-500 text-white hover:bg-green-600"
                  >
                    Add Date
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {durationState.dates.map((date) => (
                    <div
                      key={date}
                      onClick={() => durationState.removeDate(date)}
                      className="bg-blue-200 hover:bg-blue-300 text-blue-800 cursor-pointer p-2 rounded-md"
                    >
                      {formatDate(new Date(date), "dd-MM-yy")}
                    </div>
                  ))}
                </div>
              </div>
              <DialogClose asChild>
                <Button
                  type="submit"
                  className="bg-blue-500 text-white hover:bg-blue-600"
                >
                  Submit
                </Button>
              </DialogClose>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        {forms?.map((application) => (
          <div key={application.id} className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">{application.category}</h3>
            <p><strong>Reason:</strong> {application.reason}</p>
            <p><strong>Type:</strong> {application.formType}</p>
            <p><strong>Dates:</strong> {application.dates.map((d) => formatDate(new Date(d), "dd-MM-yy")).join(", ")}</p>
            <div className="mt-4">
              {application.requests.map((request, ind) => (
                <div key={request.id} className="flex items-center gap-2 mb-2">
                  <div className="flex-shrink-0 bg-gray-200 text-gray-800 p-2 rounded-full">{ind + 1}</div>
                  <div>
                    <p><strong>Status:</strong> {request.status}</p>
                    <p><strong>Name:</strong> {request.requested.name}</p>
                    <p><strong>Position:</strong> {position[ind]}</p>
                  </div>
                </div>
              ))}
              <div className="mt-2">
                {application.requests.find((request) => request.status === "REJECTED") ? (
                  <div className="text-red-500">OD Rejected</div>
                ) : application.requests.find((request) => request.status === "PENDING") ? (
                  <div className="text-yellow-500">OD Pending</div>
                ) : application.requests.every((request) => request.status === "ACCEPTED") ? (
                  <div className="text-green-500">OD Accepted</div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
