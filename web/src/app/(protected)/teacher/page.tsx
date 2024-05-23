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
    return <div>Loading...</div>;
  }
  if (!user) {
    router.push("/auth/login");
    return <div> Unauthenticated </div>;
  }
  if (user.role !== "TEACHER") {
    logout().then(() => {
      router.push("/auth/login");
    });
    return <div>Unauthorized </div>;
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

      toast.success("Application created");
    } catch (error) {
      console.log(error);
      toast.error("Error creating application");
    }
  }
  return (
    <div>
      <h1>Dashboard</h1>
      <h2>Welcome {user.name}</h2>

      {forms?.map((application) => (
        <div key={application.id}>
          <p>Requests: {application.requests.length}</p>
          <p>{application.category}</p>
          <p>{application.reason}</p>
          <p>{application.formType}</p>
          <p>
            {application.dates.map((d) => formatDate(d, "dd-MM-yy")).join(", ")}
          </p>
          {application.requests.map((request, ind) =>
            request.requestedId !== user.id || request.status === "ACCEPTED" ? (
              <div key={request.id} className="flex gap-1">
                <p>{ind + 1}</p>
                <p>{request.status}</p>
                <p>{request.requested.name}</p>
                <p>{position[ind]}</p>
              </div>
            ) : (
              <div key={request.id} className="flex gap-1">
                <p>{ind + 1}</p>
                <p>{request.status}</p>
                <p>{request.requested.name}</p>
                <p>{position[ind]}</p>
                <Button
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
            )
          )}
        </div>
      ))}
    </div>
  );
};

export default Dashboard;
