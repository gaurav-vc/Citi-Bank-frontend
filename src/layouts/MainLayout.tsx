import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '@/contexts/AuthContext';
import { Building, MapPin, Layers } from 'lucide-react';
import { AIAssistant } from '@/components/AIAssistant';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-64">
        <Header />
        <main className="p-6 space-y-4">
          {user && user.profile && (user.profile.organization_name || user.profile.site_name || user.profile.department_name) && (
            <div className="flex flex-wrap items-center gap-4 px-4 py-2 bg-muted/30 border border-muted-foreground/10 rounded-lg text-[10px] font-medium text-muted-foreground">
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
          <div>
            {children}
          </div>
        </main>
      </div>
      <AIAssistant />
    </div>
  );
}
