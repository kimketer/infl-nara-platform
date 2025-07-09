'use client';

import React from 'react';
import Image from 'next/image';

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface UserProfileProps {
  user?: User | null;
  onLogout?: () => void;
  onLogin?: () => void;
}

export default function UserProfile({ user, onLogout, onLogin }: UserProfileProps) {
  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-3">로그인이 필요합니다</p>
          <button
            onClick={onLogin}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            로그인
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center space-x-3">
        <div className="relative">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name}
              width={48}
              height={48}
              className="rounded-full"
            />
          ) : (
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-lg">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 truncate">
            {user.name}
          </h3>
          <p className="text-sm text-gray-500 truncate">
            {user.email}
          </p>
        </div>
        
        {onLogout && (
          <button
            onClick={onLogout}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            로그아웃
          </button>
        )}
      </div>
    </div>
  );
} 