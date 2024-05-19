"use client";

import { trpc } from "@/lib/trpc";
import React from "react";

const DemoClient = () => {
  const { data } = trpc.hello.useQuery();
  return (
    <div>
      <h1>Hello from tRPC: {data}</h1>
    </div>
  );
};

export default DemoClient;
