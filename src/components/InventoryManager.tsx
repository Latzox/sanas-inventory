'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Product } from '@/types/inventory'
import AddProductForm from './AddProductForm'
import ProductList from './ProductList'

export default function InventoryManager() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error

      setProducts(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleProductAdded = () => {
    setShowAddForm(false)
    fetchProducts()
  }

  const handleProductUpdated = () => {
    fetchProducts()
  }

  const handleProductDeleted = () => {
    fetchProducts()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory</h2>
          <p className="text-gray-600">Manage your products and track stock levels</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {showAddForm ? 'Cancel' : 'Add Product'}
        </button>
      </div>

      {showAddForm && (
        <AddProductForm
          onProductAdded={handleProductAdded}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      <ProductList
        products={products}
        onProductUpdated={handleProductUpdated}
        onProductDeleted={handleProductDeleted}
      />
    </div>
  )
}