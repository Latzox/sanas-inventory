import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InventoryManager from '@/components/InventoryManager'

export default async function InventoryPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <a href="/dashboard" className="text-indigo-600 hover:text-indigo-500">
                ← Dashboard
              </a>
              <h1 className="text-xl font-semibold text-gray-900">Inventory Management</h1>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700">{user.email}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <InventoryManager />
      </main>
    </div>
  )
}