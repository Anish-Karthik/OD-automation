'use client'
import Image from "next/image";
import React from "react";
import DialogModal from "../../../../components/modal/dialog-modal";
import EditModal from "../../../../components/modal/edit-modal";
import { Button } from "../../../../components/ui/button";

import DepartmentList from "./_components/department-list";
import {
  CollegeDetailsForm,
  DepartmentForm,
  EditImageForm,
} from "./_components/forms";
import { useCurrentUser } from "../../../../../../shared/hooks";
import { useRouter } from "next/navigation";
import { logout } from "../../../../../../shared/actions";

const Page = () => {
  const { user, fetching } = useCurrentUser();
  const router = useRouter();
  if (fetching) {
    return <div>Loading...</div>;
  }
  if (!user) {
    router.push("/login");
    return <div> Unauthenticated </div>;
  }
  if (user.role !== "ADMIN") {
    logout().then(() => {
      router.push("/auth/login");
    });

    return <div> Unauthorized </div>;
  }
  return (
    <div className="h-full w-full">
      <div className="relative w-full sm:h-40 md:h-60">
        <EditModal>
          <DialogModal
            title="Edit Cover Image"
            description="Edit the cover image"
          >
            <EditImageForm />
          </DialogModal>
        </EditModal>
        <Image
          src="https://picsum.photos/id/11/1600/600"
          alt="college"
          width={1600}
          height={600}
          objectFit="fill"
          className="max-h-full"
        />
      </div>
      <div className="relative z-50 mx-auto -mt-20 h-40 w-40 rounded-sm">
        <EditModal className="rounded-sm">
          <DialogModal
            title="Edit College Logo"
            description="Edit the college logo"
          >
            <EditImageForm />
          </DialogModal>
        </EditModal>
        <Image
          src="https://picsum.photos/id/88/160/160"
          alt="college"
          width={160}
          height={160}
          objectFit="cover"
          className="max-h-full rounded-sm"
        />
      </div>
      <div className="w-full">
        <div className="relative mx-auto max-w-2xl">
          <EditModal className="bg-transparent opacity-100">
            <DialogModal
              title="Edit College Details"
              description="Edit college details"
            >
              <CollegeDetailsForm />
            </DialogModal>
          </EditModal>
          <h1 className="mt-2 text-center text-2xl">
            PSNA College of Engineering and Technology
          </h1>
          <p className="text-center">
            An Autonomous Institution affiliated to Anna University
          </p>
          <p className="text-center">Dindigul, Tamilnadu - 624301</p>
        </div>
      </div>
      <div className="w-full p-5 ">
        {/* display all departments */}
        <div className="flex items-center justify-between px-5">
          <h2 className="text-xl font-semibold">Departments</h2>
          <DialogModal
            trigger={
              <Button className="rounded-lg p-1 px-3 text-white transition">
                Add Department
              </Button>
            }
            title="Add Department"
            description="Add a new department to the college."
          >
            <DepartmentForm />
          </DialogModal>
        </div>
        <DepartmentList />
      </div>
    </div>
  );
};

export default Page;
