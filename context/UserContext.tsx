import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Member } from "@/types/kanban";

interface UserContextType {
  currentUser: Member | null;
  setCurrentUser: (user: Member | null) => void;
  isUserSelected: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [isUserSelected, setIsUserSelected] = useState(false);

  useEffect(() => {
    // Check for cached user on component mount
    const cachedUser = localStorage.getItem("currentUser");
    if (cachedUser) {
      try {
        const user = JSON.parse(cachedUser);
        setCurrentUser(user);
        setIsUserSelected(true);
      } catch (error) {
        console.error("Error parsing cached user:", error);
        localStorage.removeItem("currentUser");
      }
    }
  }, []);

  const handleSetCurrentUser = (user: Member | null) => {
    setCurrentUser(user);
    setIsUserSelected(user !== null);

    if (user) {
      localStorage.setItem("currentUser", JSON.stringify(user));
    } else {
      localStorage.removeItem("currentUser");
    }
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        setCurrentUser: handleSetCurrentUser,
        isUserSelected,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
