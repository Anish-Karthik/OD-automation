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
import Navbar from "@/components/Navbar";

const position = ["Tutor", "Year In Charge", "HOD"];

const Dashboard = () => {
  const utils = trpc.useUtils();
  const durationState = useDurationDetails();
  const { user, fetching } = useCurrentUser();
  const [currDate, setCurrentDate] = React.useState<string>("");
  const { data: forms } = trpc.user.student.form.list.useQuery(user?.id || "");
  const [showAll, setShowAll] = React.useState(false);
  console.log(forms?.length);
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

  const displayedForms = showAll ? forms : forms?.slice(0, 2); // Show only 2 forms unless "View All" is clicked

  return (
    <>
      <Navbar text="OD History" />
      <div className="p-6 space-y-8 relative">
        {/* Add Application Button Positioned to Top-Right */}
        <div className="flex justify-between items-center ml-auto">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gray-200 text-blue-800 hover:bg-gray-300 ml-auto">
                Apply OD
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold">
                  Add New Application
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500">
                  Fill out the form below to submit a new application.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
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
        </div>

        {/* View All Button */}
      {forms && forms.length > 2 && (
        <Button
          onClick={() => setShowAll(!showAll)}
          className="bg-gray-200 text-blue-800 hover:bg-gray-300"
        >
          {showAll ? "View Less" : "View All"}
        </Button>
      )}

        {/* Past ODs Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {displayedForms?.map((application) => (
            <div
              key={application.id}
              className="bg-white p-6 rounded-lg shadow-md transition-transform hover:scale-105 hover:shadow-lg"
            >
              <h3 className="text-lg font-semibold mb-2 text-blue-800">
                {application.category}
              </h3>
              <p className="text-gray-700">
                <strong>Reason:</strong> {application.reason}
              </p>
              <p className="text-gray-700">
                <strong>Type:</strong> {application.formType}
              </p>
              <p className="text-gray-700">
                <strong>Dates:</strong>{" "}
                {application.dates
                  .map((d) => formatDate(new Date(d), "dd-MM-yy"))
                  .join(", ")}
              </p>
              <div className="mt-4">
                {application.requests.map((request, ind) => (
                  <div
                    key={request.id}
                    className="flex items-center gap-4 "
                  >
                    {/* <div className="bg-gray-300 text-gray-800 p-2 rounded-full">
                      {ind + 1}
                    </div>
                    <div>
                      <p className="text-gray-700">
                        <strong>Status:</strong> {request.status}
                      </p>
                      <p className="text-gray-700">
                        <strong>Name:</strong> {request.requested.name}
                      </p>
                      <p className="text-gray-700">
                        <strong>Position:</strong> {position[ind]}
                      </p>
                    </div> */}
                  </div>
                ))}
                <div className="mt-2">
                  {application.requests.find(
                    (request) => request.status === "REJECTED"
                  ) ? (
                    <div className="text-red-500 font-semibold">
                      OD Rejected
                    </div>
                  ) : application.requests.find(
                      (request) => request.status === "PENDING"
                    ) ? (
                    <div className="text-yellow-500 font-semibold">
                      OD Pending
                    </div>
                  ) : application.requests.every(
                      (request) => request.status === "ACCEPTED"
                    ) ? (
                    <div className="text-green-500 font-semibold">
                      OD Accepted
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
    </>
  );
};

export default Dashboard;
