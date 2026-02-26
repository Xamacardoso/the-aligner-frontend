import { User, UserRole } from './types';

const SESSION_KEY = 'thealign_session';

const MOCK_USERS: (User & { password: string })[] = [
  { id: 'u1', name: 'Admin Gerente', email: 'gerente@thealign.com', role: 'gerente', password: '123456' },
  { id: 'u2', name: 'Dr. Carlos Mendes', email: 'dentista@thealign.com', role: 'dentista', password: '123456' },
];

export function login(email: string, password: string, role: UserRole): User | null {
  const user = MOCK_USERS.find(u => u.email === email && u.password === password && u.role === role);
  if (!user) return null;
  const { password: _pw, ...session } = user;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
