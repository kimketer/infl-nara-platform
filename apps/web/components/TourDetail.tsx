// Cursor: React 컴포넌트 TourDetail을 작성해 줘.
// props로 받은 item 객체에서
// - tAtsNm(이름)을 h1.text-3xl.font-bold
// - areaCd, signguCd(지역코드)를 텍스트로
// - 간단 설명(item.tourDescription) p.text-base
// - 지도(Map 컴포넌트) 포함: <Map lat={item.latitude} lng={item.longitude} title={item.tAtsNm} />
// Tailwind 스타일로 레이아웃 구성해 줘.
import React from 'react'
// Map 컴포넌트는 별도 구현되어 있다고 가정
import Map from './Map'

type TourDetailProps = {
  item: {
    tAtsNm: string
    areaCd: string
    signguCd: string
    tourDescription?: string
    latitude?: number
    longitude?: number
  }
}

export default function TourDetail({ item }: TourDetailProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h1 className="text-3xl font-bold mb-2">{item.tAtsNm}</h1>
      <div className="mb-2 text-gray-600">
        지역 코드: {item.areaCd} / {item.signguCd}
      </div>
      {item.tourDescription && (
        <p className="text-base mb-4">{item.tourDescription}</p>
      )}
      {item.latitude && item.longitude && (
        <div className="mb-4">
          <Map lat={item.latitude} lng={item.longitude} title={item.tAtsNm} />
        </div>
      )}
    </div>
  )
} 