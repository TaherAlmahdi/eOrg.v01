'use client';
import { Info } from 'lucide-react';

interface NoticeProps {
  message: string;
}

const Notice = ({ message }: NoticeProps) => {
  if (!message) return null;

  return (
    <div className="flex justify-center pt-0 md:pt-0 px-0">
      <div className="flex items-start md:items-center gap-2 px-2 py-2 rounded bg-slate-50 text-slate-700 mb-2 border border-slate-200 shadow-sm w-full">
        <div className="bg-slate-200 p-2 rounded-full shrink-0">
          <Info size={20} className="text-slate-600" />
        </div>
        <p className="text-sm md:text-base font-tarunima leading-relaxed italic">
          <span className="font-bold text-slate-900 not-italic"></span> {message}
        </p>
      </div>
    </div>
  );
};

export default Notice;