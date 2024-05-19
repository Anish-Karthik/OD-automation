"use client";
import DemoClient from "@/components/DemoClient";
import Image from "next/image";
import { redirect } from "next/navigation";
import { useCurrentUser } from "../../../shared/hooks";

export default function Home() {
  const {user, fetching} = useCurrentUser();


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
    </div>
  );
}
