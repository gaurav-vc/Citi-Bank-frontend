import { ReactNode } from 'react';
import { MainLayout } from './MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Building, MapPin, Layers } from 'lucide-react';

interface EnterpriseLayoutProps {
  children: ReactNode;
}

export function EnterpriseLayout({ children }: EnterpriseLayoutProps) {
  const { user } = useAuth();

  if (!user) return <MainLayout>{children}</MainLayout>;

  return (
    <MainLayout>
      <div className="space-y-4">
        {/* Hierarchy Context Bar */}
        {(user.profile?.organization_name || user.profile?.site_name || user.profile?.department_name) && (
          <div className="flex flex-wrap items-center gap-4 px-4 py-2 bg-muted/30 border border-muted-foreground/10 rounded-lg text-xs font-medium text-muted-foreground">
            <span className="flex items-center gap-1">
              <Building className="h-3.5 w-3.5 text-primary" />
              Org: <span className="text-foreground">{user.profile.organization_name || 'Global'}</span>
            </span>
            {user.profile.site_name && (
              <>
                <span className="text-muted-foreground/30">|</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  Site: <span className="text-foreground">{user.profile.site_name}</span>
                </span>
              </>
            )}
            {user.profile.department_name && (
              <>
                <span className="text-muted-foreground/30">|</span>
                <span className="flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  Dept: <span className="text-foreground">{user.profile.department_name}</span>
                </span>
              </>
            )}
          </div>
        )}
        <div className="pt-2">
          {children}
        </div>
      </div>
    </MainLayout>
  );
}
