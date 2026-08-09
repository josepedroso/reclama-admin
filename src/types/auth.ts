export interface LoginRequest {
  identificador: string;
  senha: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiraEm: number;
}

/** Claims relevantes do JWT (payload do access token), decodificadas no cliente (CARD-16). */
export interface AccessTokenClaims {
  sub: string;
  roles: string[];
  iat: number;
  exp: number;
}
