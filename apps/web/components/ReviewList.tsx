'use client';

import useSWR from 'swr';

interface Review {
  id: number;
  tAtsCd: string;
  rating: number;
  comment: string;
  createdAt: string;
  user?: {
    name: string;
  };
}

interface ReviewListProps {
  tAtsCd: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ReviewList({ tAtsCd }: ReviewListProps) {
  const { data, error, isLoading } = useSWR<Review[]>(
    `/api/tour/review?tAtsCd=${tAtsCd}`,
    fetcher
  );

  if (isLoading) return <div className="text-center py-4">리뷰를 불러오는 중...</div>;
  if (error) return <div className="text-red-500 py-4">리뷰를 불러오는데 실패했습니다.</div>;
  if (!data || data.length === 0) return <div className="text-gray-500 py-4">아직 리뷰가 없습니다.</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold mb-4">리뷰 ({data.length})</h3>
      {data.map((review) => (
        <div key={review.id} className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-lg ${
                      i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {review.user?.name || '익명'}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              {new Date(review.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-gray-700">{review.comment}</p>
        </div>
      ))}
    </div>
  );
} 