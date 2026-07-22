import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';
import { PermissionRoute } from './PermissionRoute';
import { OrganizationRoute } from './OrganizationRoute';

// Real page imports from @/pages
import Login from '../pages/Login';
import Dashboard from '@/pages/Dashboard';
import VendorMaster from '@/pages/masters/VendorMaster';
import ItemMaster from '@/pages/masters/ItemMaster';
import RateContractMaster from '@/pages/masters/RateContractMaster';
import BudgetMaster from '@/pages/masters/BudgetMaster';
import InventoryMaster from '@/pages/masters/InventoryMaster';

import OrganizationsPage from '@/pages/masters/OrganizationsPage';
import AddOrganizationPage from '@/pages/masters/AddOrganizationPage';
import OrganizationDetailPage from '@/pages/masters/OrganizationDetailPage';
import SitesSetupPage from '@/pages/masters/SitesSetupPage';
import AddSitePage from '@/pages/masters/AddSitePage';
import DepartmentPage from '@/pages/masters/DepartmentPage';

import UsersRolesPage from '@/pages/setup/UsersRolesPage';
import ModulesPermissionsPage from '@/pages/setup/ModulesPermissionsPage';
import { WorkflowSetupPage } from '@/pages/setup/WorkflowSetupPage';
import CreateIndent from '@/pages/requisitions/CreateIndent';
import TenderingRFQ from '@/pages/tendering/TenderingRFQ';
import CreateOrder from '@/pages/orders/CreateOrder';
import PurchaseOrders from '@/pages/orders/PurchaseOrders';
import WorkOrders from '@/pages/orders/WorkOrders';
import AMCOrders from '@/pages/orders/AMCOrders';
import GRNEntry from '@/pages/inventory/GRNEntry';
import StockLedger from '@/pages/inventory/StockLedger';
import StockTransfer from '@/pages/inventory/StockTransfer';
import IssueToSite from '@/pages/inventory/IssueToSite';
import ScrapDisposal from '@/pages/inventory/ScrapDisposal';
import BillingInvoices from '@/pages/billing/BillingInvoices';
import PaymentProcessing from '@/pages/payments/PaymentProcessing';
import ExpenseManagement from '@/pages/expenses/ExpenseManagement';
import Reports from '@/pages/Reports';
import AIInsights from '@/pages/AIInsights';
import NotFound from '../pages/NotFound';
import QCChecklists from '@/pages/qc/QCChecklists';
import ChangePassword from '@/pages/ChangePassword';

import GDNEntry from '@/pages/inventory/GDNEntry';
import RTVEntry from '@/pages/inventory/RTVEntry';
import ProductInspection from '@/pages/inventory/ProductInspection';
import FinanceApprovalQueue from '@/pages/billing/FinanceApprovalQueue';

import SuperAdminDashboard from '../pages/super-admin/Dashboard';
import SuperAdminBillingLogs from '../pages/super-admin/BillingLogs';
import SuperAdminBillingLogDetail from '../pages/super-admin/BillingLogDetail';

import SuperAdminUsersRoles from '../pages/super-admin/UsersRoles';
import SuperAdminPermissions from '../pages/super-admin/Permissions';

export function AppRoutes() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <span className="text-muted-foreground text-sm">Loading...</span>
    </div>
  );

  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} />

      {/* Protected Routes */}
      <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<ProtectedRoute>{isAuthenticated && user?.role === 'super_admin' ? <Navigate to="/super-admin/dashboard" replace /> : <Dashboard />}</ProtectedRoute>} />
      
      {/* Super Admin Hub */}
      <Route path="/super-admin/dashboard" element={<ProtectedRoute><PermissionRoute roles={['super_admin']}><SuperAdminDashboard /></PermissionRoute></ProtectedRoute>} />
      <Route path="/super-admin/billing" element={<ProtectedRoute><PermissionRoute roles={['super_admin']}><SuperAdminBillingLogs /></PermissionRoute></ProtectedRoute>} />
      <Route path="/super-admin/billing/:id/log" element={<ProtectedRoute><PermissionRoute roles={['super_admin']}><SuperAdminBillingLogDetail /></PermissionRoute></ProtectedRoute>} />
      <Route path="/super-admin/organizations" element={<ProtectedRoute><PermissionRoute roles={['super_admin']}><OrganizationsPage /></PermissionRoute></ProtectedRoute>} />
      <Route path="/super-admin/sites" element={<ProtectedRoute><PermissionRoute roles={['super_admin']}><SitesSetupPage /></PermissionRoute></ProtectedRoute>} />
      <Route path="/super-admin/users-roles" element={<ProtectedRoute><PermissionRoute roles={['super_admin']}><SuperAdminUsersRoles /></PermissionRoute></ProtectedRoute>} />
      <Route path="/super-admin/permissions" element={<ProtectedRoute><PermissionRoute roles={['super_admin']}><SuperAdminPermissions /></PermissionRoute></ProtectedRoute>} />

      {/* Masters */}
      <Route
        path="/masters/vendors"
        element={
          <ProtectedRoute>
            <PermissionRoute
              roles={['super_admin', 'procurement_executive', 'procurement_manager', 'facility_manager', 'project_head', 'cxo']}
              permissionKey="procurement:vendors"
              action="view"
            >
              <VendorMaster />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/masters/items"
        element={
          <ProtectedRoute>
            <PermissionRoute
              roles={['super_admin', 'store_keeper', 'site_manager', 'procurement_executive', 'procurement_manager', 'facility_manager', 'project_head', 'cxo']}
              permissionKey="procurement:items"
              action="view"
            >
              <ItemMaster />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/masters/inventory-master"
        element={
          <ProtectedRoute>
            <PermissionRoute
              roles={['super_admin', 'store_keeper', 'site_manager', 'procurement_manager', 'facility_manager']}
              permissionKey="procurement:items"
              action="view"
            >
              <InventoryMaster />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/masters/contracts"
        element={
          <ProtectedRoute>
            <PermissionRoute
              roles={['super_admin', 'procurement_executive', 'procurement_manager', 'facility_manager', 'project_head', 'cxo']}
              permissionKey="procurement:contracts"
              action="view"
            >
              <RateContractMaster />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/masters/budget"
        element={
          <ProtectedRoute>
            <OrganizationRoute>
              <PermissionRoute
                roles={['super_admin', 'finance_executive', 'finance_manager', 'facility_manager', 'project_head', 'cxo']}
                permissionKey="procurement:budgets"
                action="view"
              >
                <BudgetMaster />
              </PermissionRoute>
            </OrganizationRoute>
          </ProtectedRoute>
        }
      />

      <Route path="/masters/hierarchy" element={<Navigate to="/masters/roles-users" replace />} />

      <Route
        path="/masters/organizations"
        element={
          <ProtectedRoute>
            <PermissionRoute
              roles={['super_admin']}
              permissionKey="core:organizations"
              action="view"
            >
              <OrganizationsPage />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/masters/organizations/new"
        element={
          <ProtectedRoute>
            <PermissionRoute
              roles={['super_admin']}
              permissionKey="core:organizations"
              action="view"
            >
              <AddOrganizationPage />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/masters/organizations/:orgId"
        element={
          <ProtectedRoute>
            <PermissionRoute
              roles={['super_admin']}
              permissionKey="core:organizations"
              action="view"
            >
              <OrganizationDetailPage />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/masters/organizations/:orgId/edit"
        element={
          <ProtectedRoute>
            <PermissionRoute
              roles={['super_admin']}
              permissionKey="core:organizations"
              action="view"
            >
              <AddOrganizationPage />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/masters/sites"
        element={
          <ProtectedRoute>
            <PermissionRoute
              roles={['super_admin', 'client_admin', 'admin']}
              permissionKey="core:sites"
              action="view"
            >
              <SitesSetupPage />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/masters/sites/new"
        element={
          <ProtectedRoute>
            <PermissionRoute
              roles={['super_admin', 'client_admin', 'admin']}
              permissionKey="core:sites"
              action="view"
            >
              <AddSitePage />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/masters/departments"
        element={
          <ProtectedRoute>
            <PermissionRoute
              roles={['super_admin', 'client_admin', 'admin']}
              permissionKey="core:departments"
              action="view"
            >
              <DepartmentPage />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/masters/roles-users"
        element={
          <ProtectedRoute>
            <PermissionRoute
              roles={['super_admin', 'client_admin', 'admin']}
              permissionKey="core:users"
              action="view"
            >
              <UsersRolesPage />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      {/* Setup */}
      <Route
        path="/setup/users-roles"
        element={
          <ProtectedRoute>
            <PermissionRoute
              roles={['super_admin', 'client_admin', 'admin']}
              permissionKey="core:users"
              action="view"
            >
              <UsersRolesPage />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/setup/modules"
        element={
          <ProtectedRoute>
            <PermissionRoute
              roles={['super_admin', 'client_admin', 'admin']}
              permissionKey="core:settings"
              action="view"
            >
              <ModulesPermissionsPage />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/setup/workflows"
        element={
          <ProtectedRoute>
            <PermissionRoute
              roles={['super_admin', 'client_admin', 'admin']}
              permissionKey="core:workflows"
              action="view"
            >
              <WorkflowSetupPage />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />

      <Route path="/masters/roles" element={<Navigate to="/setup/users-roles" replace />} />

      <Route
        path="/masters/role-access"
        element={
          <ProtectedRoute>
            <PermissionRoute
              roles={['super_admin', 'client_admin', 'admin']}
              permissionKey="core:users"
              action="view"
            >
              <ModulesPermissionsPage />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/setup/modules-permissions"
        element={
          <ProtectedRoute>
            <PermissionRoute
              roles={['super_admin', 'client_admin', 'admin']}
              permissionKey="core:users"
              action="view"
            >
              <ModulesPermissionsPage />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <PermissionRoute
              roles={['super_admin', 'client_admin', 'admin']}
              permissionKey="core:users"
              action="view"
            >
              <ModulesPermissionsPage />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />



      <Route
        path="/requisitions/create"
        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'site_keeper', 'site_manager']} permissionKey="procurement:indents">
              <CreateIndent />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/requisitions/my-requests"
        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'site_keeper', 'site_manager']} permissionKey="procurement:indents">
              <CreateIndent />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/requisitions/approvals"
        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'store_keeper', 'site_manager', 'procurement_manager', 'finance_executive', 'finance_manager', 'facility_manager', 'project_head', 'cxo']} permissionKey="procurement:indents">
              <CreateIndent />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/requisitions/all"
        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'site_keeper', 'store_keeper', 'site_manager', 'procurement_executive', 'procurement_manager', 'finance_executive', 'finance_manager', 'facility_manager', 'project_head', 'cxo']} permissionKey="procurement:indents">
              <CreateIndent />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />      <Route
        path="/indents/:id"
        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'site_keeper', 'store_keeper', 'site_manager', 'procurement_executive', 'procurement_manager', 'finance_executive', 'finance_manager', 'facility_manager', 'project_head', 'cxo']} permissionKey="procurement:indents">
              <CreateIndent />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />

      {/* Tendering */}
      <Route
        path="/rfqs/:id"
        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'procurement_executive', 'procurement_manager', 'facility_manager', 'project_head', 'cxo']} permissionKey="procurement:rfqs">
              <TenderingRFQ />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tendering/rfq"

        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'procurement_executive', 'procurement_manager', 'facility_manager', 'project_head', 'cxo']} permissionKey="procurement:rfqs">
              <TenderingRFQ />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tendering/create-rfq"
        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'procurement_executive', 'procurement_manager', 'facility_manager']} permissionKey="procurement:rfqs">
              <TenderingRFQ />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tendering/active"
        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'procurement_executive', 'procurement_manager', 'facility_manager', 'project_head', 'cxo']} permissionKey="procurement:rfqs">
              <TenderingRFQ />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tendering/comparison"
        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'procurement_executive', 'procurement_manager', 'facility_manager', 'project_head', 'cxo']} permissionKey="procurement:rfqs">
              <TenderingRFQ />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />

      {/* Orders */}
      <Route
        path="/orders/:id"
        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'procurement_executive', 'procurement_manager', 'finance_executive', 'finance_manager', 'facility_manager', 'project_head', 'cxo', 'store_keeper', 'site_keeper', 'site_manager']} permissionKey="procurement:orders">
              <PurchaseOrders />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/purchase-orders"

        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'procurement_executive', 'procurement_manager', 'finance_executive', 'finance_manager', 'facility_manager', 'project_head', 'cxo', 'store_keeper', 'site_keeper', 'site_manager']} permissionKey="procurement:orders">
              <PurchaseOrders />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/create"
        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'procurement_executive', 'procurement_manager', 'facility_manager']} permissionKey="procurement:orders">
              <CreateOrder />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/edit/:id"
        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'procurement_executive', 'procurement_manager', 'facility_manager']} permissionKey="procurement:orders">
              <CreateOrder />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/po"
        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'procurement_executive', 'procurement_manager', 'finance_executive', 'finance_manager', 'facility_manager', 'project_head', 'cxo', 'store_keeper', 'site_keeper', 'site_manager']} permissionKey="procurement:orders">
              <PurchaseOrders />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/wo"
        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'procurement_executive', 'procurement_manager', 'facility_manager']} permissionKey="procurement:orders">
              <WorkOrders />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/amc"
        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'procurement_executive', 'procurement_manager', 'facility_manager']} permissionKey="procurement:orders">
              <AMCOrders />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/my-orders"
        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'vendor']} permissionKey="procurement:orders">
              <PurchaseOrders />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />

      {/* Inventory */}
      <Route
        path="/grns/:id"
        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'store_keeper', 'site_manager', 'site_keeper']} permissionKey="procurement:grn">
              <GRNEntry />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory/inspections"
        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'store_keeper', 'site_manager', 'site_keeper']} permissionKey="procurement:grn">
              <ProductInspection />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory/grn"

        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'store_keeper', 'site_manager', 'site_keeper']} permissionKey="procurement:grn">
              <GRNEntry />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory/stock"
        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'store_keeper', 'site_manager', 'facility_manager', 'project_head', 'cxo']} permissionKey="procurement:inventory">
              <StockLedger />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory/transfer"
        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'store_keeper', 'site_manager', 'facility_manager', 'project_head', 'cxo']} permissionKey="procurement:inventory">
              <StockTransfer />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory/issue"
        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'store_keeper', 'site_manager', 'facility_manager', 'project_head', 'cxo']} permissionKey="procurement:inventory">
              <IssueToSite />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory/disposal"
        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'store_keeper', 'site_manager', 'facility_manager', 'project_head', 'cxo']} permissionKey="procurement:inventory">
              <ScrapDisposal />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />

      {/* QC & Execution */}
      <Route
        path="/qc/checklists"
        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'store_keeper', 'site_manager', 'site_keeper']} permissionKey="procurement:qc">
              <QCChecklists />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />

      {/* Billing */}
      <Route
        path="/billing/invoices/:id"
        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'finance_executive', 'finance_manager', 'facility_manager', 'project_head', 'cxo']} permissionKey="procurement:billing">
              <BillingInvoices />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/billing/upload"
        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'vendor']} permissionKey="procurement:billing">
              <BillingInvoices />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing/pending"
        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'finance_executive', 'finance_manager', 'facility_manager', 'project_head', 'cxo']} permissionKey="procurement:billing">
              <BillingInvoices />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing/verify"
        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'finance_executive', 'finance_manager', 'facility_manager', 'project_head', 'cxo']} permissionKey="procurement:billing">
              <BillingInvoices />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing/all"
        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'finance_executive', 'finance_manager', 'facility_manager', 'project_head', 'cxo']} permissionKey="procurement:billing">
              <BillingInvoices />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing/finance-approvals"
        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'finance_executive', 'finance_manager', 'facility_manager', 'project_head', 'cxo']} permissionKey="procurement:billing">
              <FinanceApprovalQueue />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />

      {/* Payments */}
      <Route
        path="/payments/proposals/:id"
        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'finance_executive', 'finance_manager', 'facility_manager', 'project_head', 'cxo']} permissionKey="procurement:payments">
              <PaymentProcessing />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payments/proposals"

        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'finance_executive', 'finance_manager', 'facility_manager', 'project_head', 'cxo']} permissionKey="procurement:payments">
              <PaymentProcessing />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payments/approvals"
        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'finance_manager', 'facility_manager', 'project_head', 'cxo']} permissionKey="procurement:payments">
              <PaymentProcessing />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payments/status"
        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'finance_executive', 'finance_manager', 'facility_manager', 'project_head', 'cxo']} permissionKey="procurement:payments">
              <PaymentProcessing />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />

      {/* Expenses */}
      <Route
        path="/expenses/create"
        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'finance_executive', 'finance_manager', 'facility_manager', 'project_head', 'cxo', 'vendor']} permissionKey="procurement:expenses">
              <ExpenseManagement />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/expenses/my-expenses"
        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'finance_executive', 'finance_manager', 'facility_manager', 'project_head', 'cxo', 'vendor']} permissionKey="procurement:expenses">
              <ExpenseManagement />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/expenses/approve"
        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'finance_manager', 'facility_manager', 'project_head', 'cxo']} permissionKey="procurement:expenses">
              <ExpenseManagement />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />

      {/* Reports & AI */}
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'procurement_manager', 'finance_manager', 'facility_manager', 'project_head', 'cxo']} permissionKey="procurement:reports">
              <Reports />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai-insights"
        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'procurement_manager', 'finance_manager', 'facility_manager', 'project_head', 'cxo']} permissionKey="procurement:ai">
              <AIInsights />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />

      {/* Vendor Portal */}
      <Route
        path="/vendor"
        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'vendor', 'procurement_executive', 'procurement_manager', 'facility_manager', 'project_head', 'cxo']} permissionKey="procurement:rfqs">
              <Navigate to="/vendor/rfqs" replace />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/rfqs"
        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'vendor', 'procurement_executive', 'procurement_manager', 'facility_manager', 'project_head', 'cxo']} permissionKey="procurement:rfqs">
              <TenderingRFQ />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/quote"
        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'vendor', 'procurement_executive', 'procurement_manager', 'facility_manager', 'project_head', 'cxo']} permissionKey="procurement:rfqs">
              <TenderingRFQ />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/invoices"
        element={
          <ProtectedRoute>
            <PermissionRoute roles={['super_admin', 'vendor', 'finance_executive', 'finance_manager', 'facility_manager', 'project_head', 'cxo']} permissionKey="procurement:billing">
              <BillingInvoices />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}