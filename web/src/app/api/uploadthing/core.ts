// File: api/uploadthing/core.ts

import { getSession } from "next-auth/react";
import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

const handleAuth = async () => {
  // const user = await currentUser()
  // if (!user) {
  //   throw new Error("Authentication error: User user not found.")
  // }
  // return { userId: user.id }
};

export const ourFileRouter = {
  collegeCover: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    // .middleware(() => handleAuth())
    .onUploadComplete((uploadedFiles) => {
      console.log("Uploaded files:", uploadedFiles);
    }),
  collegeLogo: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    // .middleware(() => handleAuth())
    .onUploadComplete((uploadedFiles) => {
      console.log("Uploaded files:", uploadedFiles);
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
