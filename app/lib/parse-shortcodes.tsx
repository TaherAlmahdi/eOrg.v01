import React from 'react';

export interface ParsedShortcodeResult {
  content: React.ReactNode;
  contentHtml: string;
  notes: Array<{ label: string; text: string; id: number }>;
}

// ইংরেজি সংখ্যাকে বাংলায় রূপান্তর করার হেল্পার
const toBengaliNumber = (num: number | string): string =>
  num.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d, 10)]);

export function parseNoteShortcodes(content: string): ParsedShortcodeResult {
  if (!content) {
    return { 
      content: null, 
      contentHtml: '', 
      notes: [] 
    };
  }

  // ১. Carriage Return (\r\n) নরমালাইজ করা
  const normalizedContent = content.replace(/\r\n/g, '\n');

  // Regex দিয়ে অপশনাল কাস্টম মার্ক সহ [note] বা [note="..."] ক্যাপচার করা
  const regex = /\[note(?:=(?:&quot;|"|')?(.*?)(?:&quot;|"|')?)?\]([\s\S]*?)\[\/note\]/gi;
  
  const extractedNotes: Array<{ label: string; text: string; id: number }> = [];
  const parts: React.ReactNode[] = [];
  let htmlString = '';
  
  let lastIndex = 0;
  let match;
  let autoIndex = 1;

  while ((match = regex.exec(normalizedContent)) !== null) {
    const customMark = match[1]?.trim();
    const noteText = match[2]?.trim();

    // শর্টকোডের আগের অংশ
    if (match.index > lastIndex) {
      let textBefore = normalizedContent.substring(lastIndex, match.index);
      
      // আগের টেক্সটের শেষের স্পেস আলাদা করে ফেলা, যাতে `sup` ট্যাগের আগে কোনো অতিরিক্ত স্পেস না থাকে
      const trailingSpaceMatch = textBefore.match(/\s+$/);
      const trailingSpace = trailingSpaceMatch ? trailingSpaceMatch[0] : '';
      textBefore = textBefore.replace(/\s+$/, '');

      if (textBefore) {
        htmlString += textBefore;
        parts.push(
          <span 
            key={`text-${lastIndex}`} 
            className="inline"
            dangerouslySetInnerHTML={{ __html: textBefore }} 
          />
        );
      }

      // স্পেসটুকু আলাদাভাবে এইচটিএমএল ও পার্টসে যুক্ত করা (যদি থাকে)
      if (trailingSpace) {
        htmlString += trailingSpace;
        parts.push(trailingSpace);
      }
    }

    // মার্ক নির্ধারণ
    const currentId = extractedNotes.length + 1;
    const label = customMark && customMark.length > 0 
      ? customMark 
      : toBengaliNumber(autoIndex++);

    extractedNotes.push({
      id: currentId,
      label: label,
      text: noteText,
    });

    // HTML স্ট্রিং-এর জন্য (whitespace-nowrap দিয়ে মুড়ে দেওয়া হয়েছে যাতে শব্দ ও নোট আলাদা লাইনে না ভাঙে)
    const noteRefHtml = `<span class="whitespace-nowrap inline"><sup class="inline font-tarunima text-base ml-0.5 leading-none select-none"><a href="#fn-${currentId}" id="fnref-${currentId}" class="text-blue-600 hover:text-red-700 font-normal no-underline inline">[${label}]</a></sup></span>`;
    htmlString += noteRefHtml;

    // React Component পার্টসে পুশ করা
    parts.push(
      <span key={`note-wrapper-${match.index}`} className="whitespace-nowrap inline">
        <sup 
          className="inline font-sans text-xs ml-0.5 leading-none select-none"
        ><a 
            href={`#fn-${currentId}`} 
            id={`fnref-${currentId}`}
            className="text-blue-600 hover:text-red-700 font-bold no-underline inline"
          >[{label}]
          </a>
        </sup>
      </span>
    );

    lastIndex = regex.lastIndex;
  }

  // কোনো শর্টকোড না থাকলে
  if (extractedNotes.length === 0) {
    return {
      content: <span dangerouslySetInnerHTML={{ __html: normalizedContent }} />,
      contentHtml: normalizedContent,
      notes: [],
    };
  }

  // শেষের অংশ
  if (lastIndex < normalizedContent.length) {
    const textAfter = normalizedContent.substring(lastIndex);
    htmlString += textAfter;
    parts.push(
      <span 
        key={`text-${lastIndex}`} 
        className="inline"
        dangerouslySetInnerHTML={{ __html: textAfter }} 
      />
    );
  }

  return {
    content: parts,
    contentHtml: htmlString,
    notes: extractedNotes,
  };
}