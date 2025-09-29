export interface Product {
  id: string
  user_id: string
  name: string
  description?: string
  current_stock: number
  unit: string
  min_stock_alert: number
  created_at: string
  updated_at: string
}

export interface StockTransaction {
  id: string
  product_id: string
  user_id: string
  transaction_type: 'add' | 'use'
  amount: number
  previous_stock: number
  new_stock: number
  notes?: string
  created_at: string
}

export interface AddProductForm {
  name: string
  description?: string
  current_stock: number
  unit: string
  min_stock_alert: number
}

export interface StockUpdateForm {
  amount: number
  notes?: string
}

export interface Order {
  id: string
  user_id: string
  supplier_name: string
  order_date: string
  expected_arrival_date?: string
  tracking_number?: string
  status: 'pending' | 'shipped' | 'delivered' | 'completed' | 'cancelled'
  notes?: string
  total_amount?: number
  created_at: string
  updated_at: string
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price?: number
  notes?: string
  created_at: string
  product?: Product
}

export interface CreateOrderForm {
  supplier_name: string
  expected_arrival_date?: string
  tracking_number?: string
  notes?: string
  items: CreateOrderItemForm[]
}

export interface CreateOrderItemForm {
  product_id: string
  quantity: number
  unit_price?: number
  notes?: string
}