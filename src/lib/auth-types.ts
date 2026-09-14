// https://www.better-auth.com/docs/concepts/typescript#additional-fields
// Types are inferred from getAuth() return type
export type Session = {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    emailVerified: boolean;
    image?: string | null;
    userType?: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  session: {
    id: string;
    expiresAt: Date;
    token: string;
    ipAddress: string | null;
    userAgent: string | null;
    userId: string;
  };
};

export type User = Session['user'];
