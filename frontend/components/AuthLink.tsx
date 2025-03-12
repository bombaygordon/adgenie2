import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';

interface AuthLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  requiresAuth?: boolean;
}

export default function AuthLink({ 
  href, 
  children, 
  className = '', 
  requiresAuth = true 
}: AuthLinkProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  
  const handleClick = (e: React.MouseEvent) => {
    if (requiresAuth && !isAuthenticated) {
      e.preventDefault();
      console.log("[AuthLink] Preventing navigation to", href, "- not authenticated");
      router.push('/dashboard');
      return;
    }
  };
  
  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
} 