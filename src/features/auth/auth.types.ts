export type LoginRequest = {
  usernameOrEmail: string;
  password: string;
};

export type AuthUser = {
  id?: string;
  email?: string;
  username?: string;
  name?: string;
};

export type LoginResponse = {
  accessToken?: string;
  token?: string;
  refreshToken?: string;
  user?: AuthUser;
  message?: string;
  /** Some backends return `{ success: false, message }` with HTTP 200. */
  success?: boolean;
};
