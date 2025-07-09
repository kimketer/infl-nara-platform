// Cursor: props로 전달된 item 객체에서 tAtsNm(이름)과 areaCd(지역코드)를 보여주는 React 컴포넌트 TourCard를 Tailwind 스타일로 작성해 줘.
// - 카드 모양: bg-white, rounded-lg, shadow, p-4
// - 제목(tAtsNm): font-semibold, text-lg
// - 부제(areaCd): text-sm, text-gray-500
import React from 'react'
import Link from 'next/link'

type TourCardProps = {
  item: {
    tAtsNm: string
    areaCd: string
    tAtsCd?: string
  }
}

export default function TourCard({ item }: TourCardProps) {
  return (
    <Link href={`/tour/${item.tAtsCd || item.areaCd}`}>
      <div className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow cursor-pointer">
        <div className="font-semibold text-lg mb-1">{item.tAtsNm}</div>
        <div className="text-sm text-gray-500">지역 코드: {item.areaCd}</div>
      </div>
    </Link>
  )
} 