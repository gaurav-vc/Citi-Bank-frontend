import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, RoleLabels } from '@/types';
import Logo from '@/components/Logo';
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  ShoppingCart,
  Warehouse,
  ClipboardCheck,
  Receipt,
  CreditCard,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Building2,
  FileSpreadsheet,
  Bell,
  Brain,
  Menu,
  X,
  Building,
  ShieldCheck,
  MapPin,
  Layers,
  Truck,
  Undo2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DBFeature {
  key: string;
  label: string;
}

interface DBModule {
  id: number;
  title: string;
  order: number;
  items: DBFeature[];
}

const iconMap: Record<string, React.ElementType> = {
  'core:dashboard': LayoutDashboard,
  'core:users': Users,
  'core:organizations': Building2,
  'core:sites': MapPin,
  'core:departments': Layers,
  'core:roles': ShieldCheck,
  'core:settings': Settings,
  'procurement:vendors': Building,
  'procurement:items': Package,
  'procurement:contracts': FileSpreadsheet,
  'procurement:budgets': Wallet,
  'procurement:indents': FileText,
  'procurement:approvals': ClipboardCheck,
  'procurement:workflows': ClipboardCheck,
  'procurement:rfqs': FileSpreadsheet,
  'procurement:orders': ShoppingCart,
  'procurement:inventory': Warehouse,
  'procurement:inventory_master': Settings,
  'procurement:inventory_issue': Warehouse,
  'procurement:inventory_transfer': Warehouse,
  'procurement:inventory_disposal': Warehouse,
  'procurement:inventory_gdn': Truck,
  'procurement:inventory_rtv': Undo2,
  'procurement:inspections': ClipboardCheck,
  'procurement:grn': Warehouse,
  'procurement:qc': ClipboardCheck,
  'procurement:billing': Receipt,
  'procurement:billing_approvals': ClipboardCheck,
  'procurement:payments': CreditCard,
  'procurement:expenses': Wallet,
  'procurement:reports': BarChart3,
  'procurement:ai': Brain,
  'procurement:indents_create': FileText,
  'procurement:indents_my': ClipboardCheck,
  'procurement:inventory_view': Warehouse,
  'procurement:qc_checklists': ClipboardCheck,
  'procurement:expenses_create': CreditCard,
  'procurement:expenses_my': Wallet,
  'superadmin:dashboard': LayoutDashboard,
  'superadmin:organizations': Building2,
  'superadmin:sites': MapPin,
  'superadmin:users': Users,
  'superadmin:permissions': ShieldCheck,
  'superadmin:billing': Receipt,
  'reports:dashboard': LayoutDashboard,
  'reports:reports': BarChart3,
  'reports:inventory_reports': FileText,
  'reports:invoice_reports': FileText,
  'reports:audit_reports': ShieldCheck,
};

const pathMap: Record<string, string> = {
  'core:dashboard': '/dashboard',
  'core:users': '/setup/users-roles',
  'core:organizations': '/masters/organizations',
  'core:sites': '/masters/sites',
  'core:departments': '/masters/departments',
  'core:roles': '/masters/roles-users',
  'core:settings': '/setup/modules',
  'core:documentation': '/setup/documentation-config',
  'core:workflows': '/setup/workflows',
  'core:setup': '/setup/users-roles',
  'procurement:vendors': '/masters/vendors',
  'procurement:items': '/masters/items',
  'procurement:contracts': '/masters/contracts',
  'procurement:budgets': '/masters/budget',
  'procurement:indents': '/requisitions/all',
  'procurement:approvals': '/requisitions/approvals',
  'procurement:workflows': '/requisitions/approvals',
  'procurement:rfqs': '/tendering/rfq',
  'procurement:rfqs_active': '/tendering/active',
  'procurement:rfqs_comparison': '/tendering/comparison',
  'procurement:rfqs_vendor': '/vendor/rfqs',
  'procurement:rfqs_quote': '/vendor/quote',
  'procurement:orders': '/purchase-orders',
  'procurement:inventory': '/inventory/stock',
  'procurement:inventory_issue': '/inventory/issue',
  'procurement:inventory_transfer': '/inventory/transfer',
  'procurement:inventory_disposal': '/inventory/disposal',
  'procurement:inventory_gdn': '/inventory/gdn',
  'procurement:inventory_rtv': '/inventory/rtv',
  'procurement:inspections': '/inventory/inspections',
  'procurement:grn': '/inventory/grn',
  'procurement:qc': '/qc/checklists',
  'procurement:billing': '/billing/all',
  'procurement:billing_approvals': '/billing/finance-approvals',
  'procurement:payments': '/payments/status',
  'procurement:expenses': '/expenses/create',
  'procurement:reports': '/reports',
  'procurement:ai': '/ai-insights',
  'procurement:indents_create': '/requisitions/create',
  'procurement:indents_my': '/requisitions/my-requests',
  'procurement:inventory_view': '/inventory/stock',
  'procurement:qc_checklists': '/qc/checklists',
  'procurement:expenses_create': '/expenses/create',
  'procurement:expenses_my': '/expenses/my-expenses',
  'procurement:inventory_master': '/masters/inventory-master',
  'superadmin:dashboard': '/super-admin/dashboard',
  'superadmin:organizations': '/super-admin/organizations',
  'superadmin:sites': '/super-admin/sites',
  'superadmin:departments': '/masters/departments',
  'superadmin:billing': '/super-admin/billing',
  'superadmin:users': '/super-admin/users-roles',
  'superadmin:permissions': '/super-admin/permissions',
  'procurement:payment_proposals': '/payments/proposals',
  'reports:dashboard': '/dashboard',
  'reports:reports': '/reports',
  'reports:inventory_reports': '/reports/inventory',
  'reports:invoice_reports': '/reports/invoices',
  'reports:audit_reports': '/reports/audit',
  'reports:ai': '/ai-insights',
};

const staticModulesFallback: DBModule[] = [
  {
    id: 1,
    title: 'Dashboard',
    order: 0,
    items: [
      { key: 'reports:dashboard', label: 'Overview' }
    ]
  },
  {
    id: 2,
    title: 'Procurement',
    order: 1,
    items: [
      { key: 'procurement:indents', label: 'Indents' },
      { key: 'procurement:rfqs', label: 'RFQs' },
      { key: 'procurement:rfqs_comparison', label: 'Quotation Comparison' },
      { key: 'procurement:rfqs_vendor', label: 'Tendering & Bidding' },
      { key: 'procurement:rfqs_quote', label: 'Submit Quotation' },
      { key: 'procurement:orders', label: 'Purchase Orders' },
      { key: 'procurement:vendors', label: 'Vendors' },
      { key: 'procurement:approvals', label: 'Approvals' }
    ]
  },
  {
    id: 3,
    title: 'Inventory',
    order: 2,
    items: [
      { key: 'procurement:items', label: 'Item Master' },
      { key: 'procurement:inventory_master', label: 'Inventory Settings' },
      { key: 'procurement:inventory', label: 'Stock Ledger' },
      { key: 'procurement:inspections', label: 'Quality Inspection' },
      { key: 'procurement:grn', label: 'GRN Entry' },
      { key: 'procurement:inventory_issue', label: 'Issue To Site (GDN)' },
      { key: 'procurement:inventory_transfer', label: 'Stock Transfer' },
      { key: 'procurement:inventory_disposal', label: 'Scrap Disposal' },
      { key: 'procurement:inventory_rtv', label: 'Return To Vendor' }
    ]
  },
  {
    id: 4,
    title: 'QC & Execution',
    order: 3,
    items: [
      { key: 'procurement:qc_checklists', label: 'Quality Inspection' }
    ]
  },
  {
    id: 5,
    title: 'Finance & Billing',
    order: 4,
    items: [
      { key: 'procurement:billing', label: 'Invoices' },
      { key: 'procurement:billing_approvals', label: 'Finance Approvals' },
      { key: 'procurement:payment_proposals', label: 'Payment Proposals' },
      { key: 'procurement:payments', label: 'Payments' },
      { key: 'procurement:budgets', label: 'Budgets' }
    ]
  },
  {
    id: 6,
    title: 'Reports & Analytics',
    order: 5,
    items: [
      { key: 'reports:reports', label: 'Spend Analytics' },
      { key: 'reports:inventory_reports', label: 'Inventory Reports' },
      { key: 'reports:invoice_reports', label: 'Invoice Reports' },
      { key: 'reports:audit_reports', label: 'Audit Reports' },
      { key: 'reports:ai', label: 'AI Recommendations' }
    ]
  },
  {
    id: 99,
    title: 'Setup',
    order: 99,
    items: [
      { key: 'core:users', label: 'Users & Roles' },
      { key: 'core:settings', label: 'Role Permissions' },
      { key: 'core:workflows', label: 'Approval Workflows' },
      { key: 'core:departments', label: 'Departments' },
      { key: 'core:documentation', label: 'System Config' }
    ]
  }
];

const moduleIconMap: Record<string, React.ElementType> = {
  'Dashboard': LayoutDashboard,
  'Procurement': ShoppingCart,
  'Inventory': Warehouse,
  'QC & Execution': ClipboardCheck,
  'Quality Inspection': ClipboardCheck,
  'Finance & Billing': Receipt,
  'Vendors': Users,
  'Reports & Analytics': BarChart3,
  'Setup': Settings,
  'Super Admin': ShieldCheck
};

export function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [modules, setModules] = useState<DBModule[]>([]);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const token = localStorage.getItem('campusspend_token');
      const base = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'));
      const res = await fetch(`${base}/api/setups/modules-features`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setModules(data);
        }
      }
    } catch (err) {
      console.error('Failed to load modules for sidebar:', err);
    }
  };

  if (!user) return null;

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  // Check user permissions dynamically
  const isFeaturePermitted = (key: string) => {
    // 1. super_admin only sees Super Admin specific menus
    if (user.role === 'super_admin') return key.startsWith('superadmin:');

    // The DB injects 'core:dashboard' which creates a duplicate in the 'Setup' menu.
    // The real top-level dashboard uses the key 'reports:dashboard'.
    if (key === 'core:dashboard') return false;

    let checkKey = key;
    
    // Explicitly block Organizations and Sites for non-admin roles, even if DB says otherwise
    if (key === 'core:organizations' || key === 'core:sites') {
      if (!['super_admin', 'client_admin', 'admin'].includes(user.role)) return false;
    }

    // Always allow admin/client_admin to access Setup pages (Users & Roles, Role Permissions) in the sidebar
    if (key === 'core:users' || key === 'core:settings' || key === 'core:documentation' || key === 'core:setup') {
      if (user.role === 'admin' || user.role === 'client_admin') return true;
    }

    // Alias mappings for sidebar keys that map to permission keys
    if (key === 'core:setup') checkKey = 'core:users';
    
    // We remove the restrictive aliases for indents, rfqs, expenses, etc. 
    // so that checking their specific checkboxes in the Super Admin UI actually works independently!
    if (key === 'procurement:approvals') checkKey = 'procurement:indents';
    if (key === 'procurement:workflows') checkKey = 'procurement:indents';
    if (key === 'procurement:inventory_master') checkKey = 'procurement:items';
    if (key === 'procurement:billing_approvals') checkKey = 'procurement:billing';
    if (key === 'reports:dashboard') checkKey = 'core:dashboard';

    // 2. Use ONLY DB permissions configured for this user
    if (user.permissions && Object.keys(user.permissions).length > 0) {
      if (checkKey === 'core:dashboard') return true;
      const perms = user.permissions[checkKey];
      if (perms !== undefined && perms !== null) {
        return perms.view === true;
      }
    }

    // Default to denying access if not mapped
    return checkKey === 'core:dashboard';
  };

  // Determine path dynamically based on role
  const getPath = (key: string) => {
    const role = user.role;
    
    if (key === 'procurement:indents') {
      if (role === 'site_keeper' || role === 'site_manager') {
        return '/requisitions/my-requests';
      }
      return '/requisitions/all';
    }
    
    if (key === 'procurement:orders') {
      if (role === 'vendor') {
        return '/orders/my-orders';
      }
      return '/purchase-orders';
    }
    
    if (key === 'procurement:rfqs') {
      return '/tendering/rfq';
    }

    if (key === 'procurement:rfqs_active') {
      return '/tendering/active';
    }

    if (key === 'procurement:rfqs_comparison') {
      return '/tendering/comparison';
    }

    if (key === 'procurement:rfqs_vendor') {
      return '/vendor/rfqs';
    }

    if (key === 'procurement:rfqs_quote') {
      return '/vendor/quote';
    }

    if (key === 'procurement:billing') {
      if (role === 'vendor') {
        return '/vendor/invoices';
      }
      return '/billing/all';
    }
    
    return pathMap[key] || '/dashboard';
  };

  // Merge static fallback modules with DB loaded modules to guarantee no items disappear
  const getMergedModules = () => {
    const merged = JSON.parse(JSON.stringify(staticModulesFallback)) as DBModule[];
    if (modules.length === 0) return merged;
    
    modules.forEach(dbMod => {
      let titleToMatch = dbMod.title;
      if (titleToMatch.toLowerCase() === 'core features') {
        titleToMatch = 'Setup';
      } else if (titleToMatch.toLowerCase() === 'quality inspection') {
        titleToMatch = 'QC & Execution';
      }

      const existing = merged.find(m => m.title.toLowerCase() === titleToMatch.toLowerCase());
      if (!existing) {
        merged.push({ ...dbMod, title: titleToMatch });
      } else {
        dbMod.items.forEach(dbItem => {
          const hasItem = existing.items.some(i => i.key === dbItem.key);
          if (!hasItem) {
            existing.items.push(dbItem);
          }
        });
      }
    });
    
    return merged;
  };

  const activeModules = getMergedModules();
  
  if (user.role === 'super_admin') {
    activeModules.unshift({
      id: 999,
      title: 'Super Admin',
      order: -1,
      items: [
        { key: 'superadmin:dashboard', label: 'Super Admin Dashboard' },
        { key: 'superadmin:organizations', label: 'Organizations' },
        { key: 'superadmin:sites', label: 'Sites' },
        { key: 'superadmin:departments', label: 'Departments' },
        { key: 'superadmin:users', label: 'Users & Roles' },
        { key: 'superadmin:permissions', label: 'Role Permissions' },
        { key: 'superadmin:billing', label: 'Billing & Payments' },
      ]
    });
  }

  // Filter modules based on dynamic permissions


  const filteredModules = activeModules.map(mod => {
    const visibleFeatures = mod.items.filter(item => {
      // Remove duplicate dashboard entry under Core Features
      if (mod.title.toLowerCase() === 'core features' && item.label.toLowerCase() === 'dashboard') {
        return false;
      }
      return isFeaturePermitted(item.key);
    });

    return {
      ...mod,
      items: visibleFeatures
    };
  }).filter(mod => {
    const isKeep = mod.items.length > 0;

    return isKeep;
  });

  const sidebarContent = (
    <div className="flex h-full flex-col bg-sidebar">
      {/* User Info */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground">
              {user.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            {user.name && RoleLabels[user.role] && user.name.trim().toLowerCase() !== RoleLabels[user.role].trim().toLowerCase() && (
              <span className="text-sm font-medium text-sidebar-foreground">{user.name}</span>
            )}
            <span className="text-xs text-sidebar-foreground/60">{RoleLabels[user.role]}</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {filteredModules.map(mod => {
            const isExpanded = expandedItems.includes(mod.title);
            const isChildActive = mod.items.some(item =>
              location.pathname.startsWith(getPath(item.key))
            );
            const ModuleIcon = moduleIconMap[mod.title] || Settings;

            if (mod.title === 'Super Admin') {
              return (
                <div key={mod.title} className="mb-4">
                  <div className="px-4 py-2 mb-1 text-xs font-bold text-sidebar-foreground/50 uppercase tracking-wider">
                    Super Admin Portal
                  </div>
                  <div className="space-y-1">
                    {mod.items.map(item => {
                      const Icon = iconMap[item.key] || Settings;
                      const path = getPath(item.key);
                      return (
                        <NavLink
                          key={item.key}
                          to={path}
                          onClick={() => setIsMobileOpen(false)}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors',
                              isActive && 'bg-sidebar-accent text-white font-semibold'
                            )
                          }
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              );
            }

            return (
              <div key={mod.title}>
                <button
                  onClick={() => toggleExpanded(mod.title)}
                  className={cn(
                    'nav-item w-full justify-between',
                    isChildActive && 'nav-item-active'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ModuleIcon className="h-5 w-5 shrink-0" />
                    <span className="truncate">{mod.title}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {isExpanded && (
                  <div className="ml-8 mt-1 space-y-1">
                    {mod.items.map(item => {
                      const Icon = iconMap[item.key] || Settings;
                      const path = getPath(item.key);
                      return (
                        <NavLink
                          key={item.key}
                          to={path}
                          onClick={() => setIsMobileOpen(false)}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-2 px-3 py-2 rounded-md text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors',
                              isActive && 'bg-sidebar-accent text-white font-medium'
                            )
                          }
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-4">
        <button onClick={logout} className="nav-item w-full text-destructive hover:text-destructive mt-2">
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-64 transition-transform lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
