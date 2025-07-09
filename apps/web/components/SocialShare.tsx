// Cursor: props로 받은 url, title을 기반으로 Facebook, Twitter 공유 버튼을 Tailwind 스타일로 렌더링하는 SocialShare 컴포넌트를 생성해 줘.
import React from 'react'

type Props = { url: string; title: string }

export default function SocialShare({ url, title }: Props) {
  return (
    <div className="flex gap-2 mt-6">
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank" rel="noopener noreferrer"
        className="bg-blue-600 text-white px-3 py-1 rounded"
      >Facebook</a>
      <a
        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`}
        target="_blank" rel="noopener noreferrer"
        className="bg-blue-400 text-white px-3 py-1 rounded"
      >Twitter</a>
    </div>
  )
} 