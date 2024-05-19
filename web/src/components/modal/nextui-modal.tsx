import React from "react"
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@nextui-org/react"

export default function NextuiModal({
  title,
  close,
  action,
  children,
}: {
  title: string
  close: React.ReactNode
  action: React.ReactNode
  children: React.ReactNode
}) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  return (
    <>
      <Modal backdrop={"blur"} isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">{title}</ModalHeader>
              <ModalBody>{children}</ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  {close}
                </Button>
                <Button color="primary" onPress={onClose}>
                  {action}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  )
}
