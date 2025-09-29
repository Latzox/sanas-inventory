'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DatabaseTest() {
  const [testResults, setTestResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const runTests = async () => {
    setLoading(true)
    const results: string[] = []

    try {
      // Test 1: Check if we can connect to Supabase
      results.push('✅ Supabase client created successfully')

      // Test 2: Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        results.push(`❌ Auth error: ${authError.message}`)
      } else if (user) {
        results.push(`✅ User authenticated: ${user.email}`)
      } else {
        results.push('❌ No user found')
      }

      // Test 3: Check if products table exists
      const { data: tablesData, error: tablesError } = await supabase
        .from('products')
        .select('count', { count: 'exact', head: true })

      if (tablesError) {
        results.push(`❌ Products table error: ${tablesError.message}`)
        results.push(`   Code: ${tablesError.code}`)
        results.push(`   Details: ${tablesError.details}`)
        results.push(`   Hint: ${tablesError.hint}`)
      } else {
        results.push('✅ Products table accessible')
      }

      // Test 4: Try to insert a test product (if table exists)
      if (!tablesError && user) {
        const testProduct = {
          name: 'Test Product',
          description: 'Test description',
          current_stock: 1.0,
          unit: 'kg',
          min_stock_alert: 0.5,
          user_id: user.id
        }

        const { data: insertData, error: insertError } = await supabase
          .from('products')
          .insert([testProduct])
          .select()

        if (insertError) {
          results.push(`❌ Insert error: ${insertError.message}`)
          results.push(`   Code: ${insertError.code}`)
          results.push(`   Details: ${insertError.details}`)
          results.push(`   Hint: ${insertError.hint}`)
        } else {
          results.push('✅ Test product inserted successfully')

          // Clean up - delete the test product
          if (insertData && insertData.length > 0) {
            await supabase
              .from('products')
              .delete()
              .eq('id', insertData[0].id)
            results.push('✅ Test product cleaned up')
          }
        }
      }

    } catch (error) {
      results.push(`❌ Unexpected error: ${error}`)
    }

    setTestResults(results)
    setLoading(false)
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Connection Test</h3>

      <button
        onClick={runTests}
        disabled={loading}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Running Tests...' : 'Run Database Tests'}
      </button>

      {testResults.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Test Results:</h4>
          <div className="bg-gray-50 p-3 rounded font-mono text-sm">
            {testResults.map((result, index) => (
              <div key={index} className={result.startsWith('❌') ? 'text-red-600' : 'text-green-600'}>
                {result}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}