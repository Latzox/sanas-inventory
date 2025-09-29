'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Product, CreateOrderForm, CreateOrderItemForm } from '@/types/inventory'

interface CreateOrderFormProps {
  products: Product[]
  onOrderCreated: () => void
  onCancel: () => void
}

export default function CreateOrderForm({ products, onOrderCreated, onCancel }: CreateOrderFormProps) {
  const [formData, setFormData] = useState<CreateOrderForm>({
    supplier_name: '',
    expected_arrival_date: '',
    tracking_number: '',
    notes: '',
    items: []
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  const addOrderItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        product_id: '',
        quantity: 0,
        unit_price: 0,
        notes: ''
      }]
    }))
  }

  const updateOrderItem = (index: number, field: keyof CreateOrderItemForm, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const removeOrderItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => {
      return total + (item.quantity * (item.unit_price || 0))
    }, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.supplier_name.trim()) {
      setError('Supplier name is required')
      return
    }

    if (formData.items.length === 0) {
      setError('At least one item is required')
      return
    }

    // Validate all items have required fields
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i]
      if (!item.product_id) {
        setError(`Product is required for item ${i + 1}`)
        return
      }
      if (item.quantity <= 0) {
        setError(`Quantity must be greater than 0 for item ${i + 1}`)
        return
      }
    }

    setIsSubmitting(true)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Create the order
      const orderData = {
        user_id: user.id,
        supplier_name: formData.supplier_name,
        expected_arrival_date: formData.expected_arrival_date || null,
        tracking_number: formData.tracking_number || null,
        notes: formData.notes || null,
        total_amount: calculateTotal(),
        status: 'pending' as const
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = formData.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price || null,
        notes: item.notes || null
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      onOrderCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Order</h3>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="supplier_name" className="block text-sm font-medium text-gray-700 mb-2">
              Supplier Name *
            </label>
            <input
              type="text"
              id="supplier_name"
              value={formData.supplier_name}
              onChange={(e) => setFormData(prev => ({ ...prev, supplier_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label htmlFor="expected_arrival_date" className="block text-sm font-medium text-gray-700 mb-2">
              Expected Arrival Date
            </label>
            <input
              type="date"
              id="expected_arrival_date"
              value={formData.expected_arrival_date}
              onChange={(e) => setFormData(prev => ({ ...prev, expected_arrival_date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="tracking_number" className="block text-sm font-medium text-gray-700 mb-2">
              Tracking Number
            </label>
            <input
              type="text"
              id="tracking_number"
              value={formData.tracking_number}
              onChange={(e) => setFormData(prev => ({ ...prev, tracking_number: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-md font-medium text-gray-900">Order Items</h4>
            <button
              type="button"
              onClick={addOrderItem}
              className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-1 px-3 rounded-md"
            >
              Add Item
            </button>
          </div>

          {formData.items.length === 0 ? (
            <div className="text-gray-500 text-center py-4 border-2 border-dashed border-gray-300 rounded-md">
              No items added. Click &quot;Add Item&quot; to start.
            </div>
          ) : (
            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-md p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h5 className="text-sm font-medium text-gray-900">Item {index + 1}</h5>
                    <button
                      type="button"
                      onClick={() => removeOrderItem(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Product *
                      </label>
                      <select
                        value={item.product_id}
                        onChange={(e) => updateOrderItem(index, 'product_id', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        required
                      >
                        <option value="">Select Product</option>
                        {products.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name} ({product.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateOrderItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.001"
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Unit Price
                      </label>
                      <input
                        type="number"
                        value={item.unit_price || ''}
                        onChange={(e) => updateOrderItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <input
                        type="text"
                        value={item.notes}
                        onChange={(e) => updateOrderItem(index, 'notes', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {formData.items.length > 0 && (
          <div className="bg-gray-50 rounded-md p-4">
            <div className="text-sm font-medium text-gray-900">
              Total Amount: ${calculateTotal().toFixed(2)}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || formData.items.length === 0}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Create Order'}
          </button>
        </div>
      </form>
    </div>
  )
}