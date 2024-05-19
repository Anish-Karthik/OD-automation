"use client";
import DemoClient from "@/components/DemoClient";
import Image from "next/image";
import { redirect } from "next/navigation";
import { useCurrentUser } from "@/shared/hooks";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { logout } from "../../../shared/actions";

export default function Home() {
  const { user, fetching } = useCurrentUser();

  if (fetching) {
    return <div>Loading...</div>;
  }
  if (!user) {
    redirect("/auth/login");
  }
  return (
    <div>
      <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
      <h1>Hello, {user?.id}</h1>
      <DemoClient />
      <Button onClick={() => logout()}>Logout</Button>
      <Link
        href={`/${user.role.toLowerCase()}`}
        className="p-2 bg-gray-300 rounded-md hover:bg-gray-200"
      >
        Dashboard
      </Link>
    </div>
  );
}
