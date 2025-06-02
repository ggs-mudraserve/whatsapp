'use client'

import { useEffect, useState } from 'react'
import { Box, Typography, Alert, Button } from '@mui/material'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/zustand/auth-store'

export function SimpleAuthTest() {
  const { user, session, isAuthenticated } = useAuthStore()
  const [testResults, setTestResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const runSingleTest = async (testNumber: number, testName: string, testFn: () => Promise<any>) => {
    console.log(`🧪 Running Test ${testNumber}: ${testName}`)
    try {
      const result = await Promise.race([
        testFn(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Test timeout after 10 seconds')), 10000))
      ])
      console.log(`✅ Test ${testNumber} passed:`, result)
      return { result: 'PASS', details: result }
    } catch (error: any) {
      console.error(`❌ Test ${testNumber} failed:`, error)
      return { result: 'FAIL', details: { error: error.message } }
    }
  }

  const runTests = async () => {
    console.log('🧪 Starting authentication tests...')
    setLoading(true)
    setTestResults([]) // Clear previous results immediately
    const results: any[] = []
    const supabase = createClient()

    // Test 1: Check Zustand session
    const test1 = await runSingleTest(1, 'Zustand Session Check', async () => {
      return {
        hasSession: !!session,
        userId: session?.user?.id,
        hasToken: !!session?.access_token,
        expiresAt: session?.expires_at,
        isAuthenticated
      }
    })
    results.push({ test: '1. Zustand Session Check', ...test1 })
    setTestResults([...results]) // Update UI after each test

    // Test 2: Supabase getSession
    const test2 = await runSingleTest(2, 'Supabase getSession', async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error
      return {
        hasSession: !!data.session,
        userId: data.session?.user?.id,
        hasToken: !!data.session?.access_token
      }
    })
    results.push({ test: '2. Supabase getSession', ...test2 })
    setTestResults([...results])

    // Test 3: Simple database function test
    const test3 = await runSingleTest(3, 'Database Function Test', async () => {
      const { data, error } = await supabase.rpc('auth_test', {})
      if (error) throw error
      return { authTestResult: data }
    })
    results.push({ test: '3. Database Function Test', ...test3 })
    setTestResults([...results])

    // Test 4: Simple table count (should work with RLS disabled)
    const test4 = await runSingleTest(4, 'Table Access Test', async () => {
      const { count, error } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
      if (error) throw error
      return { conversationCount: count }
    })
    results.push({ test: '4. Table Access Test', ...test4 })
    setTestResults([...results])

    console.log('🧪 All tests completed!')
    setLoading(false)
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Authentication Debug Test
      </Typography>
      
      <Alert severity="info" sx={{ mb: 2 }}>
        Open browser console (F12) to see detailed logs
      </Alert>
      
      <Button 
        variant="contained" 
        onClick={runTests} 
        disabled={loading}
        sx={{ mb: 2 }}
      >
        {loading ? 'Running Tests...' : 'Run Authentication Tests'}
      </Button>

      {testResults.map((result, index) => (
        <Alert 
          key={index}
          severity={result.result === 'PASS' ? 'success' : 'error'}
          sx={{ mb: 1 }}
        >
          <Typography variant="subtitle2">
            {result.test}: {result.result}
          </Typography>
          <Typography variant="body2" component="pre" sx={{ mt: 1, fontSize: '0.8rem' }}>
            {JSON.stringify(result.details, null, 2)}
          </Typography>
        </Alert>
      ))}
      
      {loading && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Tests are running... Check the browser console for real-time progress.
        </Alert>
      )}
    </Box>
  )
} 