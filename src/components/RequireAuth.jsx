import { useAuth } from '../context/AuthContext.jsx';
import SignInCard from './SignInCard.jsx';

export default function RequireAuth({ children, reason }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="card animate-pulse py-10 text-center text-slate-400">Loading…</div>;
  if (!user) return <SignInCard reason={reason} />;
  return children;
}
