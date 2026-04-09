export type UserRole = "USER_PERSONAL" | "PATIENT" | "CAREGIVER" | "DOCTOR";

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  id: number;
  name: string;
  email: string;
  role: string;
  token: string;
  message: string;
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

export type RegisterResponse = {
  id: number;
  name: string;
  email: string;
  role: string;
  message: string;
};

export type UserProfileResponse = {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
};
