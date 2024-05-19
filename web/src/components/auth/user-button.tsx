// "use client"

// import { ExitIcon } from "@radix-ui/react-icons"
// import { FaUser } from "react-icons/fa"

// import { useCurrentUser } from "@/hooks/use-current-user"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu"
// import { LogoutButton } from "@/components/auth/logout-button"

// export const UserButton = () => {
//   const user = useCurrentUser()

//   return (
//     <DropdownMenu>
//       <DropdownMenuTrigger>
//         <Avatar>
//           <AvatarImage src={user?.image || ""} />
//           <AvatarFallback className="bg-sky-500">
//             <FaUser className="text-white" />
//           </AvatarFallback>
//         </Avatar>
//       </DropdownMenuTrigger>
//       <DropdownMenuContent className="w-40" align="end">
//         <LogoutButton>
//           <DropdownMenuItem>
//             <ExitIcon className="mr-2 h-4 w-4" />
//             Logout
//           </DropdownMenuItem>
//         </LogoutButton>
//       </DropdownMenuContent>
//     </DropdownMenu>
//   )
// }
