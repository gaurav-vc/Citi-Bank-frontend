import { useState, useEffect, useRef } from 'react';
import { dashboardAPI } from '@/api/dashboard';
import { requisitionsAPI } from '@/api/requisitions';
import { searchAPI, SearchResult } from '@/api/search';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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
import { Search, Bell, Settings, User, LogOut, HelpCircle } from 'lucide-react';
import { RoleLabels } from '@/types';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [supportInfo, setSupportInfo] = useState<any>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

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
      try {
        const results = await searchAPI.globalSearch(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300); // debounce 300ms

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (user && user.role !== 'super_admin') {
      fetchHeaderData();
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

      const indentsData = await requisitionsAPI.getIndents();
      if (indentsData) {
        const list = Array.isArray(indentsData) ? indentsData : (indentsData.results || []);
        setNotifications(list.slice(0, 15));
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
              {isSearching ? (
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
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                      {notifications.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto scrollbar-thin">
                <DropdownMenuLabel className="sticky top-0 bg-background z-10 pt-2 pb-1">Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator className="sticky top-8 z-10" />
                {notifications.length > 0 ? (
                  notifications.map((notif: any, idx: number) => (
                    <DropdownMenuItem key={idx} className="flex flex-col items-start gap-1 p-3">
                      <span className="font-medium">
                        {notif.status === 'pending' ? 'Requires approval' : 'Indent updated'}
                      </span>
                      <span className="text-sm text-muted-foreground">{notif.id} - {notif.category}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(notif.created_at || Date.now()).toLocaleDateString()}
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
            <DropdownMenuItem asChild>
              <a href={supportInfo?.url || '#'} target="_blank" rel="noreferrer" className="cursor-pointer justify-center text-primary font-medium">
                View Documentation
              </a>
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
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
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
    </header>
  );
}
