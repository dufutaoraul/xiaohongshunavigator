import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      message: 'API test successful',
      environment: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasDifyUrl: !!process.env.DIFY_API_URL,
        hasDifyKey: !!process.env.DIFY_API_KEY,
        difyUrl: process.env.DIFY_API_URL || 'not set'
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json(
      { error: 'Test API failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Test API POST called with:', body)
    
    return NextResponse.json({
      message: 'POST test successful',
      receivedBody: body,
      environment: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasDifyUrl: !!process.env.DIFY_API_URL,
        hasDifyKey: !!process.env.DIFY_API_KEY,
        difyUrl: process.env.DIFY_API_URL || 'not set'
      }
    })
  } catch (error) {
    console.error('Test API POST error:', error)
    return NextResponse.json(
      { error: 'Test API POST failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}