export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role: string
  emailVerified?: boolean
  organization?: {
    id: string
    name: string
  }
}

export interface LoginDto {
  email: string
  password: string
  deviceFingerprint?: string
}

export interface AuthResponse {
  access_token: string
  user: User
}

export interface DeviceVerificationResponse {
  needDeviceVerification: true
  message: string
  email?: string
}

export type LoginResult = AuthResponse | DeviceVerificationResponse

export function isDeviceVerification(result: LoginResult): result is DeviceVerificationResponse {
  return 'needDeviceVerification' in result && result.needDeviceVerification === true
}
