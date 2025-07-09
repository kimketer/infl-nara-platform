import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params.path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params.path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params.path, 'PUT');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params.path, 'PATCH');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params.path, 'DELETE');
}

async function handleRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  const path = pathSegments.join('/');
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3005';
  const url = `${backendUrl}/auth/${path}`;

  try {
    const headers = new Headers();
    
    // 쿠키에서 토큰 추출하여 Authorization 헤더로 변환
    const token = request.cookies.get('token')?.value;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    // Content-Type 헤더 복사
    const contentType = request.headers.get('content-type');
    if (contentType) {
      headers.set('Content-Type', contentType);
    }

    const body = method !== 'GET' ? await request.text() : undefined;

    const response = await fetch(url, {
      method,
      headers,
      body,
    });

    const data = await response.json();

    // 로그인/회원가입 성공 시 토큰을 쿠키에 저장
    if (response.ok && (path === 'login' || path === 'register')) {
      const responseHeaders = new Headers();
      responseHeaders.set('Set-Cookie', `token=${data.accessToken}; Path=/; HttpOnly; SameSite=Strict`);
      
      return NextResponse.json(data, {
        status: response.status,
        headers: responseHeaders,
      });
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Auth API proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 