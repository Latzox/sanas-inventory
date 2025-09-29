'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Product, StockUpdateForm } from '@/types/inventory'

interface StockUpdateModalProps {
  product: Product
  onClose: () => void
  onStockUpdated: () => void
}

export default function StockUpdateModal({ product, onClose, onStockUpdated }: StockUpdateModalProps) {
  const [updateType, setUpdateType] = useState<'add' | 'use'>('use')
  const [formData, setFormData] = useState<StockUpdateForm>({
    amount: 0,
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const amount = updateType === 'use' ? -Math.abs(formData.amount) : Math.abs(formData.amount)
      const newStock = product.current_stock + amount

      if (newStock < 0) {
        throw new Error('Cannot reduce stock below zero')
      }

      // Start a transaction
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Not authenticated')

      // Update product stock
      const { error: updateError } = await supabase
        .from('products')
        .update({ current_stock: newStock })
        .eq('id', product.id)

      if (updateError) throw updateError

      // Record transaction
      const { error: transactionError } = await supabase
        .from('stock_transactions')
        .insert([{
          product_id: product.id,
          user_id: userData.user.id,
          transaction_type: updateType,
          amount: Math.abs(formData.amount),
          previous_stock: product.current_stock,
          new_stock: newStock,
          notes: formData.notes || null,
        }])

      if (transactionError) throw transactionError

      onStockUpdated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stock')
    } finally {
      setLoading(false)
    }
  }

  const calculateNewStock = () => {
    if (updateType === 'add') {
      return product.current_stock + Math.abs(formData.amount)
    } else {
      return Math.max(0, product.current_stock - Math.abs(formData.amount))
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Update Stock - {product.name}
          </h3>
          <p className="text-sm text-gray-500">
            Current Stock: {product.current_stock.toFixed(3)} {product.unit}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Update Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="updateType"
                  value="use"
                  checked={updateType === 'use'}
                  onChange={(e) => setUpdateType(e.target.value as 'add' | 'use')}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Use/Remove</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="updateType"
                  value="add"
                  checked={updateType === 'add'}
                  onChange={(e) => setUpdateType(e.target.value as 'add' | 'use')}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Add/Restock</span>
              </label>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount ({product.unit}) *
            </label>
            <input
              type="number"
              id="amount"
              required
              min="0"
              step="0.001"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="0.000"
            />
          </div>

          {formData.amount > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                New stock level will be: <strong>{calculateNewStock().toFixed(3)} {product.unit}</strong>
              </p>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Optional notes about this transaction"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || formData.amount <= 0}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 ${
                updateType === 'add'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {loading ? 'Updating...' : updateType === 'add' ? 'Add Stock' : 'Use Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}