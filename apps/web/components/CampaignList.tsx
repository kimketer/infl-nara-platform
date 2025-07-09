'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface Campaign {
  id: number;
  title: string;
  description: string;
  creatorId: number;
  createdAt: string;
  creator?: {
    name: string;
  };
}

export default function CampaignList() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns');
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data);
      } else {
        setError('캠페인을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      setError('캠페인을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말로 이 캠페인을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCampaigns(campaigns.filter(campaign => campaign.id !== id));
      } else {
        alert('캠페인 삭제에 실패했습니다.');
      }
    } catch (error) {
      alert('캠페인 삭제에 실패했습니다.');
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">캠페인 목록</h2>
      
      {campaigns.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          아직 생성된 캠페인이 없습니다.
        </div>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{campaign.title}</h3>
                  <p className="text-gray-600 mt-1">{campaign.description}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    작성자: {campaign.creator?.name || '알 수 없음'} | 
                    생성일: {new Date(campaign.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                {user && campaign.creatorId === user.id && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {/* 수정 기능 구현 */}}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(campaign.id)}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 