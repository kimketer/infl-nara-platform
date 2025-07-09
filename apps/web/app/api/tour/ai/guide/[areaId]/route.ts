// Cursor: Next.js App Router용 route.ts 파일로,
// params.areaId를 받아 `/tour/ai/guide/${areaId}` 엔드포인트를 호출하고
// 반환된 JSON을 그대로 클라이언트에 리턴하는 GET 핸들러를 작성해 줘.
import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: { areaId: string } }) {
  const { areaId } = params
  const apiUrl = `${process.env.BACKEND_URL || 'http://localhost:3000'}/tour/ai/guide/${areaId}`
  try {
    const res = await fetch(apiUrl)
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch AI guide' }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Server error', detail: String(error) }, { status: 500 })
  }
} 