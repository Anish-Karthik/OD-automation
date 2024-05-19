import type { PrismaTypes } from "../../backend/src";
import { currentUser } from "../actions";
import { useEffect, useState } from "react";

export const useCurrentUser = () => {
  const [user, setUser] = useState<PrismaTypes.User | null>(null);
  const [fetching, setFetching] = useState<boolean>(true);

  useEffect(() => {
    setFetching(true);
    currentUser()
      .then((user) => {
        setUser(user);
        setFetching(false);
      })
      .catch((error) => {
        console.log(error);
        setFetching(false);
      });
  }, []);

  return { user, fetching };
};
