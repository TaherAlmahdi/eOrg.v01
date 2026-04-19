'use client';
import { useState } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';

const Search = () => {
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    window.location.href = `/search?q=${encodeURIComponent(query)}`;
  };

  return (
    <form 
      onSubmit={handleSearch}
      /* বাইরের অতিরিক্ত বর্ডার, ব্যাকগ্রাউন্ড এবং রেডিয়াস সম্পূর্ণ রিমুভ করা হয়েছে */
      className="relative flex items-center w-full transition-all"
    >
      {/* ইনপুট এরিয়া কন্টেইনার: ১০ পিক্সেল রেডিয়াস */}
      <div className="flex flex-1 items-center bg-gray-50 rounded-[10px] border border-gray-100 focus-within:border-[#008080] focus-within:bg-white transition-all">
        <div className="pl-4 text-gray-400">
          <SearchIcon size={18} />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="গল্প বা লেখকের নাম লিখুন..."
          className="w-full py-3 px-3 bg-transparent outline-none text-gray-700 text-sm md:text-base placeholder:text-gray-400 rounded-[10px]"
        />

        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors mr-1"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* সার্চ বাটন: এটি ইনপুট এরিয়ার বাইরে থাকলেও কোনো বাড়তি হোল্ডারে নেই */}
      <button
        type="submit"
        className="bg-[#008080] text-white px-6 md:px-10 py-3.5 font-bold hover:bg-[#006666] transition-colors ml-2 rounded-[10px]"
      >
        খুঁজুন
      </button>
    </form>
  );
};

export default Search;