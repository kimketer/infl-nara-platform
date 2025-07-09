// Cursor: Next.js App Router용 search 결과 페이지로, useSearchParams와 SWR을 사용해
// 1) URL 쿼리스트링에서 키워드(q)를 읽고
// 2) `/api/tours/search?numOfRows=10&pageNo=1&MobileOS=WEB&MobileApp=MyApp&baseYm=202507&keyword=${q}` 를 호출해서
// 3) 반환된 data.items를 TourCard 그리드로 렌더링하는
// Tailwind 스타일의 SearchPage 컴포넌트를 작성해 줘.
// - 페이지 상단에 " "{q}" 검색 결과" 제목(h1.text-2xl.mb-4)
// - 3열(grid-cols-3) 그리드
'use client'
import { useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import TourCard from '@/components/TourCard'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function SearchPage() {
  const searchParams = useSearchParams()
  const q = searchParams.get('q') || ''
  const { data, error } = useSWR(
    q
      ? `/api/tours/search?numOfRows=10&pageNo=1&MobileOS=WEB&MobileApp=MyApp&baseYm=202507&keyword=${encodeURIComponent(q)}`
      : null,
    fetcher
  )

  return (
    <section className="container mx-auto p-6">
      <h1 className="text-2xl mb-4">"{q}" 검색 결과</h1>
      {error && <p className="text-red-500">에러: {error.message}</p>}
      {!data && !error && <p>로딩 중…</p>}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.items?.length ? (
            data.items.map((item: any) => (
              <TourCard key={item.tAtsCd || item.id} item={item} />
            ))
          ) : (
            <div className="col-span-3 text-center text-gray-400">검색 결과가 없습니다.</div>
          )}
        </div>
      )}
    </section>
  )
} 