// "use client"

// import { useCallback, useEffect, useState } from "react"
// import { useRouter, useSearchParams } from "next/navigation"
// import { newVerification } from "@/actions/new-verification"
// import toast from "react-hot-toast"
// import { BeatLoader } from "react-spinners"

// import { CardWrapper } from "@/components/auth/card-wrapper"
// import { FormError } from "@/components/form-error"
// import { FormSuccess } from "@/components/form-success"

// export const NewVerificationForm = () => {
//   const [error, setError] = useState<string | undefined>()
//   const [success, setSuccess] = useState<string | undefined>()

//   const router = useRouter()
//   const searchParams = useSearchParams()

//   const token = searchParams.get("token")

//   const onSubmit = useCallback(() => {
//     if (success || error) return

//     if (!token) {
//       setError("Missing token!")
//       return
//     }

//     newVerification(token)
//       .then((data) => {
//         setSuccess(data.success)
//         if (data.success) {
//           toast.success("Your account has been verified!")
//           router.push("/auth/login")
//         } else {
//           setError(data.error)
//         }
//       })
//       .catch(() => {
//         setError("Something went wrong!")
//       })
//   }, [token, success, error])

//   useEffect(() => {
//     onSubmit()
//   }, [onSubmit])

//   return (
//     <CardWrapper
//       headerLabel="Confirming your verification"
//       backButtonLabel="Back to login"
//       backButtonHref="/auth/login"
//     >
//       <div className="flex w-full items-center justify-center">
//         {!success && !error && <BeatLoader />}
//         <FormSuccess message={success} />
//         {!success && <FormError message={error} />}
//       </div>
//     </CardWrapper>
//   )
// }
