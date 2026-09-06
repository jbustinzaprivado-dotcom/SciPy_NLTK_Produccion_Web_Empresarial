import { requestPublicJson, setToken } from './http';

interface LoginResponse {
  access_token: string;
  token_type: string;
  nombre: string;
  rol: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const data = await requestPublicJson<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.access_token);
  return data;
}