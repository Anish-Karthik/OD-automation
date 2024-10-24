import Link from "next/link";
import React from "react";
import ProfileInfo from "../Cards/ProfileInfo";

const Navbar = ({ text }: { text: string }) => {
  return (
    <>
      <div className="bg-white flex items-center justify-between px-6 py-2 drop-shadow">
        {text === "Dashboard" ? (
          <>
            <h2 className="text-xl font-medium text-black py-2">OD History</h2>
            <Link
              replace
              href="/teacher/"
              className="text-black hover:text-gray-200 underline"
            >
              Dashboard
            </Link>
          </>
        ) : (
          <>
            <h2 className="text-xl font-medium text-black py-2">
              OD Automation
            </h2>
            <Link
              replace
              href="/teacher/history"
              className="text-black hover:text-gray-200 underline"
            >
              OD History
            </Link>
          </>
        )}
        <ProfileInfo />
      </div>
    </>
  );
};

export default Navbar;
