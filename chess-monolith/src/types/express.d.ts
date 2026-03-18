declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        username: string;
        email: string;
        name: string;
        losses: number;
        wins: number;
        draws: number;
        rating: number;
        image?: string | null;
        emailVerified?: boolean;
        role?: string | null;
      };
      session?: {
        id: string;
        userId: string;
        expiresAt: Date;
      };
    }
  }
}

export {};
