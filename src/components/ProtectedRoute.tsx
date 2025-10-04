import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface Props {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: Props) {
  const navigate = useNavigate();
  const { session, user, loading, getUser } = useAuthStore();

  useEffect(() => {
    if (!session) {
      getUser();
    }
  }, [session, getUser]);

  useEffect(() => {
    if (!loading && !session) {
      navigate('/login');
      return;
    }

    if (!loading && requireAdmin && user?.role !== 'Administrador') {
      navigate('/pedidos');
      return;
    }
  }, [loading, session, user, requireAdmin, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}