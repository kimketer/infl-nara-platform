'use client'
import useSWR from 'swr'
import TourCard from './TourCard'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function TourList() {
  const { data, error } = useSWR('/api/tours/areas?numOfRows=6&pageNo=1&MobileOS=WEB&MobileApp=MyApp&baseYm=202507&areaCd=1&signguCd=1', fetcher)
  if (error) return <p className="text-red-500">에러: {error.message}</p>
  if (!data) return <p>로딩 중…</p>
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {data.items?.map((item: any) => (
        <TourCard key={item.tAtsCd || item.id} item={item} />
      ))}
    </div>
  )
} 