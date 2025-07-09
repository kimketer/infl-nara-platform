'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SearchForm() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/tour/search?q=${encodeURIComponent(query)}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-xl mx-auto mb-6">
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="여행지 검색..."
        className="flex-1 border rounded-l p-2 focus:outline-none"
      />
      <button
        type="submit"
        className="bg-primary text-white px-4 rounded-r"
      >
        검색
      </button>
    </form>
  )
} 