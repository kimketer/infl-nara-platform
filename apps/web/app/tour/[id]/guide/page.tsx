// Cursor: Next.js App Router용 page.tsx로,
// useParams로 id를 추출하고,
// SWR을 사용해 `/api/tour/ai/guide/${id}`를 호출하여
// { title, outline, itinerary, tips }을 받아오고,
// 로딩·에러 처리 후
// article.prose 레이아웃으로 항목별(h2~h4, p, pre) 렌더링하는
// AIGuidePage 컴포넌트를 작성해 줘.
'use client'
import { useParams } from 'next/navigation'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function AIGuidePage() {
  const params = useParams()
  const id = params?.id as string
  const { data, error } = useSWR(
    id ? `/api/tour/ai/guide/${encodeURIComponent(id)}` : null,
    fetcher
  )

  if (error) return <p className="text-red-500">에러: {error.message}</p>
  if (!data) return <p>로딩 중…</p>

  const { title, outline, itinerary, tips } = data

  return (
    <section className="container mx-auto p-6">
      <article className="prose max-w-2xl mx-auto">
        <h2>{title}</h2>
        {outline && (
          <section>
            <h3>여행 개요</h3>
            <p>{outline}</p>
          </section>
        )}
        {itinerary && (
          <section>
            <h3>추천 일정</h3>
            <pre className="whitespace-pre-wrap bg-gray-100 p-3 rounded">{itinerary}</pre>
          </section>
        )}
        {tips && (
          <section>
            <h3>여행 팁</h3>
            <p>{tips}</p>
          </section>
        )}
      </article>
    </section>
  )
} 