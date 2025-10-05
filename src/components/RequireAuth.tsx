import { Navigate, useLocation } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import useAuth from '../hooks/useAuth';

interface RequireAuthProps {
  children: JSX.Element;
  roles?: string[];
}

export default function RequireAuth({ children, roles }: RequireAuthProps) {
  const location = useLocation();
  const { user, isLoading, hasRole } = useAuth();

  if (isLoading) {
    return <div className="d-flex justify-content-center py-5"><Spinner animation="border" /></div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && roles.length > 0 && !hasRole(...roles)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
