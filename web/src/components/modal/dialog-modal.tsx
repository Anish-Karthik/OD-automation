"use client"

import React from "react"
import { Edit2 } from "lucide-react"

import { DialogModalProps } from "@/types/ui"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const DialogModal = ({
  title = "Dialog Title",
  description = "Dialog Description",
  trigger = <Edit2 width={15} height={15} />,
  children,
}: DialogModalProps) => {
  // fix hydration issue
  const [isMounted, setIsMounted] = React.useState(false)
  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null
  return (
    <Dialog>
      <DialogTrigger>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
          {children}
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

export default DialogModal
