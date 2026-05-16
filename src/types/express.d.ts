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
      };
    }
  }
}

export {};
