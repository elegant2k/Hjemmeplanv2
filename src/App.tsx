import { AuthProvider } from '@/lib/auth'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/lib/router'

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App