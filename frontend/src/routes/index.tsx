import { createFileRoute, redirect } from '@tanstack/react-router'

function getAuthToken(): string | null {
  return localStorage.getItem('openpos_token');
}

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    const token = getAuthToken();
    if (!token) {
      throw redirect({ to: '/login' });
    }
    throw redirect({ to: '/pos' });
  },
})
