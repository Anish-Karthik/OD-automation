"use client";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { logout } from "@/shared/actions";
import { useCurrentUser } from "@/shared/hooks";
import { useRouter } from "next/navigation";

import { formatDate } from "date-fns";
import toast from "react-hot-toast";

const position = ["Tutor", "Year In Charge", "HOD"];

const Dashboard = () => {
  const utils = trpc.useUtils();
  const { user, fetching } = useCurrentUser();
  const { data: forms } = trpc.user.teacher.form.list.useQuery(user?.id || "");
  const acceptOrRejectApplication =
    trpc.user.teacher.form.acceptOrReject.useMutation({
      onSuccess: () => {
        utils.user.teacher.form.list.cancel();
        utils.user.teacher.form.list.invalidate();
      },
    });
  const router = useRouter();

  if (fetching) {
    return <div className="text-center text-gray-500">Loading...</div>;
  }
  if (!user) {
    router.push("/auth/login");
    return <div className="text-center text-gray-500">Unauthenticated</div>;
  }
  if (user.role !== "TEACHER") {
    logout().then(() => {
      router.push("/auth/login");
    });
    return <div className="text-center text-gray-500">Unauthorized</div>;
  }

  async function onSubmit({
    requesterId,
    requestId,
    status,
    reasonForRejection,
  }: {
    requesterId: string;
    requestId: string;
    status: "ACCEPTED" | "REJECTED";
    reasonForRejection: string;
  }) {
    try {
      await acceptOrRejectApplication.mutateAsync({
        requesterId,
        requestId,
        status,
        reasonForRejection,
        requestedId: user!.id,
      });

      toast.success("Application updated successfully");
    } catch (error) {
      console.log(error);
      toast.error("Error updating application");
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Dashboard</h1>
      <h2 className="text-xl font-semibold text-gray-700 mb-6">Welcome, {user.name}</h2>

      {forms?.map((application) => (
        <div key={application.id} className="bg-gray-50 p-4 rounded-lg shadow-sm mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Category: {application.category}</h3>
          <p className="text-gray-600 mb-2">Reason: {application.reason}</p>
          <p className="text-gray-600 mb-2">Form Type: {application.formType}</p>
          <p className="text-gray-600 mb-4">
            Dates: {application.dates.map((d) => formatDate(d, "dd-MM-yy")).join(", ")}
          </p>

          {application.requests.map((request, ind) =>
            request.requestedId !== user.id || request.status !== "PENDING" ? (
              <div key={request.id} className="flex items-center gap-4 mb-2 p-2 bg-white shadow rounded">
                <p className="text-gray-700">{ind + 1}. {request.status}</p>
                <p className="text-gray-700">{request.requested.name}</p>
                <p className="text-gray-500">{position[ind]}</p>
              </div>
            ) : (
              <div key={request.id} className="flex items-center gap-4 mb-2 p-2 bg-white shadow rounded">
                <p className="text-gray-700">{ind + 1}. {request.status}</p>
                <p className="text-gray-700">{request.requested.name}</p>
                <p className="text-gray-500">{position[ind]}</p>
                <div className="ml-auto flex gap-2">
                  <Button
                    className="bg-green-500 hover:bg-green-600 text-white"
                    onClick={() =>
                      onSubmit({
                        requesterId: application.requesterId,
                        requestId: request.id,
                        status: "ACCEPTED",
                        reasonForRejection: "",
                      })
                    }
                  >
                    Accept
                  </Button>
                  <Button
                    className="bg-red-500 hover:bg-red-600 text-white"
                    onClick={() =>
                      onSubmit({
                        requesterId: application.requesterId,
                        requestId: request.id,
                        status: "REJECTED",
                        reasonForRejection: "",
                      })
                    }
                  >
                    Reject
                  </Button>
                </div>
              </div>
            )
          )}
        </div>
      ))}
    </div>
  );
};

export default Dashboard;
