'use client'
import { useParams } from 'next/navigation'
import useSWR from 'swr'
import TourDetail from '@/components/TourDetail'
import ReviewList from '@/components/ReviewList'
import ReviewForm from '@/components/ReviewForm'
import SocialShare from '@/components/SocialShare'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function DetailPage() {
  const params = useParams()
  const id = params?.id as string
  const { data, error, mutate } = useSWR(
    id
      ? `/api/tours/areas?numOfRows=1&pageNo=1&MobileOS=WEB&MobileApp=MyApp&baseYm=202507&tAtsCd=${encodeURIComponent(id)}`
      : null,
    fetcher
  )

  if (error) return <p className="text-red-500">에러: {error.message}</p>
  if (!data) return <p>로딩 중…</p>

  const item = data.items?.[0]
  if (!item) return <p>데이터가 없습니다.</p>

  const handleReviewSubmitted = () => {
    // 리뷰가 제출되면 리뷰 목록을 새로고침
    mutate();
  };

  return (
    <section className="container mx-auto p-6">
      <TourDetail item={item} />
      
      <SocialShare 
        url={`${window.location.origin}/tour/${id}`}
        title={item.tAtsNm}
      />
      
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ReviewList tAtsCd={id} />
        </div>
        <div>
          <ReviewForm tAtsCd={id} onReviewSubmitted={handleReviewSubmitted} />
        </div>
      </div>
    </section>
  )
} 