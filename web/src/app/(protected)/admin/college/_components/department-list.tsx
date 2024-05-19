"use client"

import React from "react"

import { Skeleton } from "@/components/ui/skeleton"

import DepartmentCard from "./department-card"
import { trpc } from "@/lib/trpc"

const DepartmentList = () => {
  const { data: departments, isLoading } = trpc.department.getAll.useQuery()

  return (
    <div className="grid grid-cols-1 gap-x-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {isLoading || !departments
        ? [...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-18 mb-2" />
          ))
        : departments?.map((department) => (
            <DepartmentCard {...department} className="" key={department.id} />
          ))}
    </div>
  )
}

export default DepartmentList
