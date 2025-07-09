import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tAtsCd = searchParams.get('tAtsCd');

  if (!tAtsCd) {
    return NextResponse.json({ error: 'tAtsCd is required' }, { status: 400 });
  }

  try {
    const apiUrl = `${process.env.BACKEND_URL || 'http://localhost:3005'}/tour/review?tAtsCd=${tAtsCd}`;
    const res = await fetch(apiUrl);
    
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Review fetch error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tAtsCd, rating, comment } = body;

    if (!tAtsCd || !rating || !comment) {
      return NextResponse.json(
        { error: 'tAtsCd, rating, and comment are required' },
        { status: 400 }
      );
    }

    const apiUrl = `${process.env.BACKEND_URL || 'http://localhost:3005'}/tour/review`;
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tAtsCd, rating, comment }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to create review' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Review creation error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 