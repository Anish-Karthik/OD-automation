import { UserRole } from "@prisma/client";
import { db } from "../../lib/auth";
import { isEmail, isRegNo } from "../../lib/utils";

export const isValidUUID = (id: string): boolean => {
  return id.match(/^[0-9a-fA-F]{24}$/) !== null;
};

export async function getUser(username: string) {
  try {
    return (
      (await db.user.findUnique({
        where: {
          username: username,
        },
      })) ||
      (await db.user.findUnique({
        where: {
          email: username,
        },
      })) ||
      (await db.user.findFirst({
        where: {
          student: {
            regNo: username,
          },
        },
      })) ||
      (isValidUUID(username)
        ? await db.user.findUnique({
            where: {
              id: username,
            },
          })
        : null)
    );
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function createUser(
  username: string,
  password: string,
  userRole?: UserRole
) {
  const isValidUserName =
    isEmail(username, ["psnacet.edu.in"]) && !isRegNo(username);
  // const isValidUserEmail = isEmail(username, ["psnacet.edu.in"]);
  if (!isValidUserName) {
    return null;
  }

  return db.user.create({
    data: {
      role: userRole || UserRole.ADMIN,
      email: username,
      username: username,
      password: password,
    },
  });
}
