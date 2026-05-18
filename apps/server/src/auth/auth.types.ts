export type AuthenticatedUser = {
  id: string;
  email: string;
};

export type JwtPayload = {
  sub: string;
  email: string;
};

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
};

export type PublicUser = {
  id: string;
  email: string;
};

export type AuthResult = {
  token: string;
  user: PublicUser;
};
