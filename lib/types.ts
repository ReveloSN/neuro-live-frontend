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

export type UserLinkResponse = {
  id: number;
  patientId: number | null;
  linkedUserId: number | null;
  linkType: "CAREGIVER" | "DOCTOR" | string | null;
  status: "PENDING" | "ACTIVE" | "REVOKED" | string;
  createdAt: string | null;
  expiresAt: string | null;
  consumedAt: string | null;
  revokedAt: string | null;
};

export type BiometricTelemetrySampleResponse = {
  sampleId: number;
  patientId: number;
  deviceMac: string;
  bpm: number;
  spo2: number;
  observedAt: string;
  predictionState: "STABLE" | "WARNING" | "PRE_CRISIS" | "INSUFFICIENT_DATA" | string | null;
  predictionConfidence: number | null;
  predictionReasoning: string | null;
};

export type DeviceResponse = {
  id: number;
  patientId: number;
  macAddress: string;
  connected: boolean;
  linkedAt: string | null;
  lastConnection: string | null;
  sensorContact: boolean | null;
  fallBackConfig: string | null;
};

export type ClinicalAnalysisResponse = {
  patientId: number;
  totalEvents: number;
  activeEvents: number;
  averageDurationSeconds: number;
  averageSamValence: number;
  averageSamArousal: number;
  interventionCounts: Record<string, number>;
  baselineBpm: number | null;
  baselineSpo2: number | null;
};

export type CrisisEventResponse = {
  id: number;
  patientId: number;
  state: string;
  emotionalState: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  interventionType: string | null;
  triggerBpm: number | null;
  triggerSpo2: number | null;
  typingErrorRate: number | null;
  typingDwellTime: number | null;
  typingFlightTime: number | null;
  typingErrorCount: number | null;
  samValence: number | null;
  samArousal: number | null;
  clinicalSummary: string | null;
  clinicalSummaryGeneratedAt: string | null;
  clinicalSummaryModel: string | null;
};

export type PageResponse<T> = {
  content: T[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
};
