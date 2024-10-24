import { logout } from "@/shared/actions";
import { useCurrentUser } from "@/shared/hooks";
import { redirect } from "next/navigation";
import React from "react";

const ProfileInfo = () => {
  const { user, fetching } = useCurrentUser();
  const getInitials = (name: string | null) => {
    if (!name) return "";
    const words = name.split(" ");
    let initials = "";
    for (let i = 0; i < Math.min(words.length, 2); i++) {
      initials += words[i][0];
    }
    return initials.toUpperCase();
  };
  return (
    <div className="flex items-center gap-3">
      {user ? (
        <div className="w-12 h-12 flex items-center justify-center rounded-full text-slate-950 font-medium bg-slate-100">
          {getInitials(user?.name)}
        </div>
      ) : null}
      <div>
        <p className="text-sm font-medium">{user?.name}</p>
        <button
          className="text-sm text-slate-700 underline"
          onClick={() => {
            logout();
            window.location.reload();
          }}
        >
          {!user ? "Login" : "Logout"}
        </button>
      </div>
    </div>
  );
};

export default ProfileInfo;
