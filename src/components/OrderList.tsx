'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Order } from '@/types/inventory'

interface OrderListProps {
  orders: Order[]
  onOrderUpdated: () => void
}

const statusStyles = {
  pending: 'bg-yellow-100 text-yellow-800',
  shipped: 'bg-blue-100 text-blue-800',
  delivered: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
}

const statusLabels = {
  pending: 'Pending',
  shipped: 'Shipped',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled'
}

export default function OrderList({ orders, onOrderUpdated }: OrderListProps) {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null)
  const [error, setError] = useState('')

  const supabase = createClient()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    setUpdatingOrder(orderId)
    setError('')

    try {
      // If completing the order, we need to update inventory
      if (newStatus === 'completed') {
        await completeOrderAndUpdateInventory(orderId)
      } else {
        const { error } = await supabase
          .from('orders')
          .update({ status: newStatus })
          .eq('id', orderId)

        if (error) throw error
      }

      onOrderUpdated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order status')
    } finally {
      setUpdatingOrder(null)
    }
  }

  const completeOrderAndUpdateInventory = async (orderId: string) => {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Get the order with its items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          product:products (*)
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError) throw orderError

    // Start a transaction-like operation
    // Update order status to completed
    const { error: statusError } = await supabase
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', orderId)

    if (statusError) throw statusError

    // Update inventory for each item
    for (const item of order.order_items) {
      const newStock = item.product.current_stock + item.quantity

      // Update product stock
      const { error: stockError } = await supabase
        .from('products')
        .update({
          current_stock: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.product_id)

      if (stockError) throw stockError

      // Create stock transaction record
      const { error: transactionError } = await supabase
        .from('stock_transactions')
        .insert({
          product_id: item.product_id,
          user_id: user.id,
          transaction_type: 'add',
          amount: item.quantity,
          previous_stock: item.product.current_stock,
          new_stock: newStock,
          notes: `Order completion - Order ID: ${orderId}`
        })

      if (transactionError) throw transactionError
    }
  }

  const updateTrackingNumber = async (orderId: string, trackingNumber: string) => {
    setUpdatingOrder(orderId)
    setError('')

    try {
      const { error } = await supabase
        .from('orders')
        .update({ tracking_number: trackingNumber })
        .eq('id', orderId)

      if (error) throw error

      onOrderUpdated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tracking number')
    } finally {
      setUpdatingOrder(null)
    }
  }

  const toggleExpanded = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId)
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
        <p className="text-gray-500">Create your first order to start tracking deliveries.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {orders.map((order) => (
        <div key={order.id} className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-2">
                  <h3 className="text-lg font-medium text-gray-900">
                    {order.supplier_name}
                  </h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[order.status]}`}>
                    {statusLabels[order.status]}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Order Date:</span>
                    <br />
                    {formatDate(order.order_date)}
                  </div>
                  {order.expected_arrival_date && (
                    <div>
                      <span className="font-medium">Expected Arrival:</span>
                      <br />
                      {formatDate(order.expected_arrival_date)}
                    </div>
                  )}
                  {order.tracking_number && (
                    <div>
                      <span className="font-medium">Tracking:</span>
                      <br />
                      {order.tracking_number}
                    </div>
                  )}
                  {order.total_amount && (
                    <div>
                      <span className="font-medium">Total:</span>
                      <br />
                      ${order.total_amount.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleExpanded(order.id)}
                  className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                >
                  {expandedOrder === order.id ? 'Hide Details' : 'Show Details'}
                </button>

                {order.status !== 'completed' && order.status !== 'cancelled' && (
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                    disabled={updatingOrder === order.id}
                    className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="completed">Complete Order</option>
                    <option value="cancelled">Cancel</option>
                  </select>
                )}
              </div>
            </div>

            {expandedOrder === order.id && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                {order.notes && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Notes:</h4>
                    <p className="text-sm text-gray-600">{order.notes}</p>
                  </div>
                )}

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Order Items:</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {order.order_items?.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {item.product?.name || 'Unknown Product'}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {item.quantity} {item.product?.unit}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {item.unit_price ? `$${item.unit_price.toFixed(2)}` : '-'}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {item.unit_price ? `$${(item.quantity * item.unit_price).toFixed(2)}` : '-'}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {item.notes || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {order.status !== 'completed' && order.status !== 'cancelled' && (
                  <div className="flex items-center space-x-4">
                    <input
                      type="text"
                      placeholder="Update tracking number..."
                      defaultValue={order.tracking_number || ''}
                      onBlur={(e) => {
                        if (e.target.value !== (order.tracking_number || '')) {
                          updateTrackingNumber(order.id, e.target.value)
                        }
                      }}
                      disabled={updatingOrder === order.id}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}