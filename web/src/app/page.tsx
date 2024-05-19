import DemoClient from "@/components/DemoClient";
import { currentUser } from "@/lib/auth";
import { api } from "@/lib/axiosConfig";
import Image from "next/image";

export default async function Home() {
  const user = await currentUser();
  const tmp = await api.get("/");
  console.log(tmp.data);
  console.log(user);
  return (
    <div>
      <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
      <h1>Hello, {user?.id}</h1>
      <DemoClient />
    </div>
  );
}
