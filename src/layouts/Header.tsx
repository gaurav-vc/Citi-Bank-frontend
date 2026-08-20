import { useState, useEffect, useRef } from 'react';
import { dashboardAPI } from '@/api/dashboard';
import { requisitionsAPI } from '@/api/requisitions';
import { searchAPI, SearchResult } from '@/api/search';
import { notificationsAPI } from '@/api/notifications';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Bell, Settings, User, LogOut, HelpCircle, BookOpen, FileText, PlayCircle, Lightbulb } from 'lucide-react';
import { RoleLabels } from '@/types';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AccountModal } from '@/components/AccountModal';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [supportInfo, setSupportInfo] = useState<any>(null);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [docs, setDocs] = useState<any[]>([]);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  const handleDocClick = (e: React.MouseEvent, doc: any) => {
    e.preventDefault();
    if (doc.url) {
      window.open(doc.url, '_blank');
    } else if (doc.video_file) {
      window.open(doc.video_file, '_blank');
    } else {
      toast({
        title: "Coming Soon",
        description: "Detailed documentation for this module will be added shortly.",
      });
    }
  };

  useEffect(() => {
    if (isDocsOpen && docs.length === 0) {
      dashboardAPI.getDocumentation()
        .then((res: any) => {
          const data = Array.isArray(res) ? res : (res.results || []);
          setDocs(data);
        })
        .catch(err => console.error('Failed to fetch docs:', err));
    }
  }, [isDocsOpen]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const handleNotificationClick = async (notif: any) => {
    try {
      if (!notif.is_read) {
        await notificationsAPI.markAsRead(notif.id);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      }
      if (notif.link_url) {
        navigate(notif.link_url);
      }
    } catch (err: any) {
      toast({
        title: "Navigation Error",
        description: `Failed to open notification: ${err.message || 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const results = await searchAPI.globalSearch(searchQuery);
        setSearchResults(results);
      } catch (error: any) {
        console.error('Search failed:', error);
        setSearchError(error.response?.data?.error || error.message || 'Unknown error occurred');
      } finally {
        setIsSearching(false);
      }
    }, 300); // debounce 300ms

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (user && user.role !== 'super_admin') {
      fetchHeaderData();
      const interval = setInterval(fetchHeaderData, 15000); // Poll every 15s
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchHeaderData = async () => {
    try {
      const metricsData = await dashboardAPI.getMetrics();
      if (metricsData && metricsData.dashboardMetrics) {
        setPendingCount(metricsData.dashboardMetrics.pendingApprovals?.value ?? metricsData.dashboardMetrics.pendingApprovals ?? 0);
      }
      if (metricsData && metricsData.supportInfo) {
        setSupportInfo(metricsData.supportInfo);
      }

      const notifs = await notificationsAPI.getNotifications();
      if (notifs) {
        setNotifications(notifs.slice(0, 15));
      }
    } catch (err) {
      console.error('Failed to fetch header data:', err);
    }
  };

  if (!user) return null;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
      {/* Search — hidden for super_admin */}
      {user.role !== 'super_admin' && (
        <div className="hidden md:flex flex-1 max-w-md relative" ref={searchRef}>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search vendors, POs, invoices..."
              className="pl-10 bg-muted/50 focus-visible:ring-primary"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
            />
          </div>
          
          {/* Search Results Dropdown */}
          {showSearchResults && searchQuery.trim().length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-md shadow-lg overflow-hidden z-50 max-h-96 overflow-y-auto">
              {searchError ? (
                <div className="p-4 text-center text-sm text-destructive bg-destructive/10 border border-destructive rounded-md m-2">
                  <span className="font-bold">Error:</span> {searchError}
                </div>
              ) : isSearching ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>
              ) : searchResults.length > 0 ? (
                <div className="py-2">
                  {searchResults.map((result, idx) => (
                    <div 
                      key={`${result.type}-${result.id}-${idx}`}
                      className="px-4 py-2 hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => {
                        navigate(result.url);
                        setShowSearchResults(false);
                        setSearchQuery('');
                      }}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-sm text-foreground">{result.title}</span>
                        <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">{result.type}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">{result.subtitle}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">No results found for "{searchQuery}"</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Right side */}
      <div className="flex items-center gap-4 ml-auto">
        {/* Quick Stats Badge + Bell — hidden for super_admin */}
        {user.role !== 'super_admin' && (
          <>
            <Badge variant="outline" className="hidden sm:flex gap-2 py-1.5">
              <span className="text-muted-foreground">Pending:</span>
              <span className="font-semibold text-warning">{pendingCount} Approvals</span>
            </Badge>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {notifications.filter(n => !n.is_read).length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                      {notifications.filter(n => !n.is_read).length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto scrollbar-thin">
                <DropdownMenuLabel className="sticky top-0 bg-background z-10 pt-2 pb-1">Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator className="sticky top-8 z-10" />
                {notifications.length > 0 ? (
                  notifications.map((notif: any, idx: number) => (
                    <DropdownMenuItem 
                      key={idx} 
                      className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${notif.is_read ? 'opacity-70' : 'bg-slate-50 dark:bg-slate-900/50'}`}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <span className={`font-medium ${!notif.is_read ? 'text-slate-900 dark:text-slate-100' : ''}`}>
                        {notif.title}
                      </span>
                      {notif.message && <span className="text-sm text-muted-foreground">{notif.message}</span>}
                      <span className="text-xs text-muted-foreground mt-1">
                        {new Date(notif.created_at || Date.now()).toLocaleString()}
                      </span>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="p-3 text-sm text-muted-foreground text-center">No new notifications</div>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-center text-primary justify-center">
                  View all notifications
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}

        {/* Dynamic Help/Support */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <HelpCircle className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Support Contacts</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-default focus:bg-transparent">
              <span className="text-sm font-semibold">Email</span>
              <a href={`mailto:${supportInfo?.email || 'support@campusspend.com'}`} className="text-sm text-primary hover:underline">
                {supportInfo?.email || 'support@campusspend.com'}
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-default focus:bg-transparent">
              <span className="text-sm font-semibold">Phone Helpline</span>
              <span className="text-sm text-muted-foreground">{supportInfo?.contact || '1800-CAMPUS-HELP'}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={(e) => { e.preventDefault(); setIsDocsOpen(true); }}
              className="cursor-pointer justify-center text-primary font-medium"
            >
              View Documentation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium">{user.name}</span>
                <span className="text-xs text-muted-foreground">{RoleLabels[user.role]}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsAccountModalOpen(true)}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsAccountModalOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Documentation Sheet */}
      <Sheet open={isDocsOpen} onOpenChange={setIsDocsOpen}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0 border-l border-slate-200 dark:border-slate-800">
          <SheetHeader className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-500/20 text-orange-600 rounded-lg">
                <BookOpen className="h-6 w-6" />
              </div>
              <div className="text-left">
                <SheetTitle className="text-xl font-bold">Documentation Center</SheetTitle>
                <SheetDescription>
                  Guides, tutorials, and resources for CampusProcurement.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
          
          <ScrollArea className="h-[calc(100vh-120px)] p-6">
            <div className="space-y-8 pb-10">
              
              {/* Getting Started */}
              {docs.filter(d => d.category === 'quick_start').length > 0 && (
                <section className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" /> Quick Start
                  </h3>
                  <div className="grid gap-3">
                    {docs.filter(d => d.category === 'quick_start').map(doc => (
                      <a 
                        key={doc.id}
                        href={doc.url || '#'}
                        onClick={(e) => handleDocClick(e, doc)}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-orange-500/50 hover:bg-orange-50/30 transition-all cursor-pointer group block"
                      >
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-orange-600 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-400 group-hover:text-orange-500" /> 
                          {doc.title}
                        </h4>
                        {doc.description && <p className="text-xs text-muted-foreground mt-1 ml-6">{doc.description}</p>}
                      </a>
                    ))}
                  </div>
                </section>
              )}

              {/* Video Tutorials */}
              {docs.filter(d => d.category === 'video_tutorial').length > 0 && (
                <section className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <PlayCircle className="h-4 w-4" /> Video Tutorials
                  </h3>
                  <div className="grid gap-3">
                    {docs.filter(d => d.category === 'video_tutorial').map(doc => (
                      <a
                        key={doc.id}
                        href={doc.video_file || doc.url || '#'}
                        onClick={(e) => handleDocClick(e, doc)}
                        className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 aspect-video flex items-center justify-center group cursor-pointer block"
                      >
                        <img 
                          src={doc.thumbnail_url || "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2070&auto=format&fit=crop"} 
                          alt={doc.title} 
                          className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity" 
                        />
                        <PlayCircle className="h-12 w-12 text-white/80 group-hover:text-white group-hover:scale-110 transition-all z-10" />
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                          <p className="text-white font-medium text-sm">{doc.title}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </section>
              )}
              
              {/* Modules */}
              {docs.filter(d => d.category === 'module_guide').length > 0 && (
                <section className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" /> Module Guides
                  </h3>
                  <div className="space-y-2">
                    {docs.filter(d => d.category === 'module_guide').map(doc => (
                      <a 
                        key={doc.id} 
                        href={doc.url || '#'}
                        onClick={(e) => handleDocClick(e, doc)}
                        className="flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-800 dark:hover:bg-slate-900/50 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors block"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                          {doc.title}
                        </div>
                        <span className="text-xs text-muted-foreground">View →</span>
                      </a>
                    ))}
                  </div>
                </section>
              )}
              
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <AccountModal 
        isOpen={isAccountModalOpen} 
        onClose={() => setIsAccountModalOpen(false)} 
      />

    </header>
  );
}
