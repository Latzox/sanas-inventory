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