'use client'
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useCurrentUser } from "@/shared/hooks";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar/Navbar";

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',     
  }).format(date);
};

const DashboardPending = () => {
  const utils = trpc.useUtils();
  const { user, fetching } = useCurrentUser();
  const { data: forms } = trpc.user.teacher.form.list.useQuery(user?.id || "");
  const acceptOrRejectApplication = trpc.user.teacher.form.acceptOrReject.useMutation({
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

  // Filter pending requests for the current user
  const pendingForCurrentUser = forms?.filter((form) =>
    form.requests.some((req) => req.requestedId === user.id && req.status === "PENDING")
  );

  async function onSubmit({ requesterId, requestId, status }: any) {
    try {
      await acceptOrRejectApplication.mutateAsync({
        requesterId,
        requestId,
        status,
        reasonForRejection: "",
        requestedId: user!.id,
      });

      toast.success("Application updated successfully");
    } catch (error) {
      toast.error("Error updating application");
    }
  }


  return (
    <div>
      <Navbar text="OD History" />
      <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Pending Requests</h2>
        {pendingForCurrentUser && pendingForCurrentUser.length > 0 ? (
          pendingForCurrentUser.map((application) => (
            <div key={application.id} className="bg-gray-50 p-4 rounded-lg shadow-sm mb-4">
              {/* Render student details first */}
              <div className="mb-4 space-y-2">
                <div className="flex justify-between">
                  <p className="font-bold">Student Name:</p>
                  <p className="font-normal">{application?.requester?.student?.name || 'Anish Karthik A'}</p>
                </div>
                <div className="flex justify-between">
                  <p className="font-bold">Register Number:</p>
                  <p className="font-normal">{application?.requester?.student?.regNo || '921321104020'}</p>
                </div>
                <div className="flex justify-between">
                  <p className="font-bold">Year & Section:</p>
                  <p className="font-normal">
                    {`${application?.requester?.student?.year || '3'}-${application?.requester?.student?.section || 'A'}`}
                  </p>
                </div>
              </div>

              {/* Render OD details */}
              <div className="mb-4 space-y-2">
              <div className="flex justify-between">
                  <p className="font-bold">Total ODs:</p>
                  <p className="font-normal">16</p>
                </div>
                <div className="flex justify-between">
                  <p className="font-bold">Category:</p>
                  <p className="font-normal">{application.category}</p>
                </div>
                <div className="flex justify-between">
                  <p className="font-bold">Dates:</p>
                  <p className="font-normal">
                    {application.dates.map((date: string, index: number) => (
                      <span key={index}>{formatDate(date)}{index < application.dates.length - 1 ? ' - ' : ''}</span>
                    ))}
                  </p>
                </div>
                <div className="flex justify-between">
                  <p className="font-bold">Reason:</p>
                  <p className="font-normal">{application.reason}</p>
                </div>
              </div>

              {/* Render each request with Accept/Reject buttons */}
              {application.requests.map((request, ind) => (
                <div key={request.id} className="flex items-center gap-4 mb-2 p-2 bg-white shadow rounded">
                  <p className="text-gray-700">{ind + 1}. {request.status}</p>
                  <Button
                    className="bg-green-500 hover:bg-green-600 text-white"
                    onClick={() =>
                      onSubmit({
                        requesterId: application.requesterId,
                        requestId: request.id,
                        status: "ACCEPTED",
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
                      })
                    }
                  >
                    Reject
                  </Button>
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500">No pending OD requests</div>
        )}
      </div>
    </div>
  );
};

export default DashboardPending;
