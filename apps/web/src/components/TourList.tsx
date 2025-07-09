'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function TourList() {
  const { data, error } = useSWR('/api/tours/areas?numOfRows=5&pageNo=1&MobileOS=WEB&MobileApp=MyApp&baseYm=202507&areaCd=1&signguCd=1', fetcher);

  if (error) return <p>에러 발생: {error.message}</p>;
  if (!data) return <p>로딩 중…</p>;

  return (
    <ul>
      {data.items?.map((item: any) => (
        <li key={item.tAtsCd}>{item.tAtsNm}</li>
      ))}
    </ul>
  );
} 