import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // 쿼리 파라미터들을 백엔드로 전달
  const queryString = searchParams.toString();
  
  try {
    const apiUrl = `${process.env.BACKEND_URL || 'http://localhost:3005'}/tour/areas?${queryString}`;
    const res = await fetch(apiUrl);
    
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch tour areas' }, { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Tour areas fetch error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 