'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import UserProfile from '@/components/UserProfile';
import CampaignList from '@/components/CampaignList';
import CampaignForm from '@/components/CampaignForm';
import Tabs from '@/components/Tabs';

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('campaigns');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const tabs = [
    {
      id: 'campaigns',
      label: '내 캠페인',
      content: <CampaignList />,
    },
    {
      id: 'create',
      label: '캠페인 생성',
      content: <CampaignForm />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 사이드바 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <UserProfile user={user} onLogout={logout} />
              
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">메뉴</h3>
                <nav className="space-y-2">
                  <button
                    onClick={() => router.push('/')}
                    className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    홈으로
                  </button>
                  <button
                    onClick={() => router.push('/tour')}
                    className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    여행지 둘러보기
                  </button>
                </nav>
              </div>
            </div>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
                <p className="text-gray-600 mt-1">캠페인을 관리하고 새로운 캠페인을 만들어보세요.</p>
              </div>
              
              <div className="p-6">
                <Tabs tabs={tabs} defaultTab="campaigns" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 