import React from "react"

import { cn } from "@/lib/utils"

const EditModal = ({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) => {
  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center bg-white opacity-0 transition-opacity duration-200 [mask-image:radial-gradient(ellipse_at_bottom_left,transparent_50%,black)] hover:opacity-100 dark:bg-black",
        className
      )}
    >
      <div className="absolute right-0 top-0 p-1">
        <button className="rounded-lg p-1 px-2 text-black">{children}</button>
      </div>
    </div>
  )
}

export default EditModal
