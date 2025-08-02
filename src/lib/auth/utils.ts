import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export type AuthSession = {
  session: {
    user: {
      id: string;
      name?: string;
      email?: string;
    };
  } | null;
};

export const getUserAuth = async () => {
  try {
    const { userId, sessionClaims } = await auth();
    
    if (userId) {
      return {
        session: {
          user: {
            id: userId,
            name: `${sessionClaims?.firstName || ''} ${sessionClaims?.lastName || ''}`.trim(),
            email: sessionClaims?.email,
          },
        },
      } as AuthSession;
    } else {
      return { session: null };
    }
  } catch (error) {
    console.error('Error getting user auth:', error);
    return { session: null };
  }
};

export const checkAuth = async () => {
  try {
    const { userId } = await auth();
    if (!userId) {
      redirect("/sign-in");
    }
    return userId;
  } catch (error) {
    console.error('Error checking auth:', error);
    redirect("/sign-in");
  }
};