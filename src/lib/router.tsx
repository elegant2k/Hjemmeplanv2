import { createBrowserRouter } from 'react-router-dom'
import Dashboard from '@/pages/Dashboard'
import TasksPage from '@/pages/TasksPage'
import RewardsPage from '@/pages/RewardsPage'
import { AdminLayout } from '@/components'
import AdminDashboard from '@/pages/AdminDashboard'
import AdminFamily from '@/pages/admin/AdminFamily'
import AdminUsers from '@/pages/admin/AdminUsers'
import AdminSettings from '@/pages/admin/AdminSettings'
import AdminData from '@/pages/admin/AdminData'
import ProtectedRoute from '@/components/ProtectedRoute'
import MainLayout from '@/components/layout/MainLayout'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />
      },
      {
        path: 'tasks',
        element: <TasksPage />
      },
      {
        path: 'rewards',
        element: <RewardsPage />
      },
      {
        path: 'admin',
        element: (
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <AdminDashboard />
          },
          {
            path: 'family',
            element: <AdminFamily />
          },
          {
            path: 'users',
            element: <AdminUsers />
          },
          {
            path: 'settings',
            element: <AdminSettings />
          },
          {
            path: 'data',
            element: <AdminData />
          }
        ]
      }
    ]
  }
])