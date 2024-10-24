"use client";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useCurrentUser } from "@/shared/hooks";
import Navbar from "@/components/Navbar/Navbar";
import { redirect } from "next/navigation";

const ODHistory = () => {
  const { user, fetching } = useCurrentUser();
  const { data: forms } = trpc.user.teacher.form.list.useQuery(user?.id || "");

  const [showAllPast, setShowAllPast] = useState(true);
  const [showPending, setShowPending] = useState(false);

  if (fetching) {
    return <div className="text-center text-gray-500">Loading...</div>;
  }
  if (!user) {
    redirect("/auth/login");
    return <div className="text-center text-gray-500">Unauthenticated</div>;
  }

  const pendingForOtherUsers = forms?.filter((form) =>
    form.requests.some(
      (req) => req.requestedId !== user?.id && req.status === "PENDING"
    )
  );

  const nonPendingRequests = forms?.filter((form) =>
    form.requests.every((req) => req.status !== "PENDING")
  );

  const displayedPastODs = showAllPast
    ? nonPendingRequests?.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    : nonPendingRequests
        ?.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 3);

  // Helper function to format the createdAt date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div>
      <Navbar text="Dashboard" />
      <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
        {/* Heading */}

        {/* Buttons for View All and View Pending */}
        <div className="flex justify-between items-center mb-6">
          {/* <button
            onClick={() => setShowAllPast(!showAllPast)}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700"
          >
            {showAllPast ? 'Show Less' : 'View All Past ODs'}
          </button> */}
          <button
            onClick={() => setShowPending(!showPending)}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 ml-auto"
          >
            {showPending ? "Hide Pending by Others" : "View Pending by Others"}
          </button>
        </div>

        {/* Pending Requests for Other Users */}
        {showPending && (
          <div className="mt-6">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">
              Pending by Others
            </h3>
            {pendingForOtherUsers && pendingForOtherUsers.length > 0 ? (
              pendingForOtherUsers.map((application) => (
                <div
                  key={application.id}
                  className="bg-gray-50 p-4 rounded-lg shadow-sm mb-4"
                >
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-lg font-semibold text-gray-700">
                      OD Date: {formatDate(application.createdAt)}
                    </p>
                  </div>
                  <div className="p-2 bg-white rounded shadow">
                    {application.requests.map((request, ind) => (
                      <div
                        key={request.id}
                        className="flex justify-between items-center mb-2"
                      >
                        <p className="text-gray-700">
                          {ind + 1}. {request.requested.name}
                        </p>
                        <p
                          className={`text-sm font-medium ${
                            request.status === "ACCEPTED"
                              ? "text-green-500"
                              : request.status === "REJECTED"
                              ? "text-red-500"
                              : "text-yellow-500"
                          }`}
                        >
                          {request.status}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500">
                No pending requests by other users
              </div>
            )}
            <hr className="mb-10" />
          </div>
        )}

        {/* Past ODs */}
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Past ODs</h3>
        {displayedPastODs && displayedPastODs.length > 0 ? (
          <>
            {displayedPastODs.map((application) => (
              <div
                key={application.id}
                className="bg-gray-50 p-4 rounded-lg shadow-sm mb-4"
              >
                <div className="flex justify-between items-center mb-2">
                  <p className="text-lg font-semibold text-gray-700">
                    OD Date: {formatDate(application.createdAt)}
                  </p>
                </div>
                <div className="p-2 bg-white rounded shadow">
                  {application.requests.map((request, ind) => (
                    <div
                      key={request.id}
                      className="flex justify-between items-center mb-2"
                    >
                      <p className="text-gray-700">
                        {ind + 1}. {request.requested.name}
                      </p>
                      <p
                        className={`text-sm font-medium ${
                          request.status === "ACCEPTED"
                            ? "text-green-500"
                            : request.status === "REJECTED"
                            ? "text-red-500"
                            : "text-yellow-500"
                        }`}
                      >
                        {request.status}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="text-center text-gray-500">No Past ODs</div>
        )}

        
      </div>
    </div>
  );
};

export default ODHistory;
