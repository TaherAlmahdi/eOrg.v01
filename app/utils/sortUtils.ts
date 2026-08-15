// utils/sortUtils.ts

// 🔹 বাংলা সংখ্যাকে ইংরেজি সংখ্যায় রূপান্তর
export const convertBengaliToEnglishNumerals = (str: string | number): number => {
  if (typeof str === "number") return str;
  if (!str) return 0;

  const bnNumbers = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  const converted = str
    .toString()
    .replace(/[০-৯]/g, (w) => bnNumbers.indexOf(w).toString());

  // স্ট্রিং থেকে প্রথম পাওয়া সংখ্যাটি বের করে আনা (যেমন: "পর্ব ২" -> 2)
  const match = converted.match(/\d+/);
  return match ? parseInt(match[0], 10) : Number.MAX_SAFE_INTEGER;
};

// 🔹 সিরিজের বই সর্ট করার লজিক
export const sortSeriesBooks = (books: any[]) => {
  return [...books].sort((a, b) => {
    // ১. প্রথমে explicit seriesOrder/part ফিল্ড চেক
    const orderA = convertBengaliToEnglishNumerals(a.seriesOrder ?? a.part ?? a.volume);
    const orderB = convertBengaliToEnglishNumerals(b.seriesOrder ?? b.part ?? b.volume);

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    // ২. যদি seriesOrder না থাকে, টাইটেল থেকে সংখ্যা বের করে Natural Sort করা
    const titleNumA = convertBengaliToEnglishNumerals(a.title);
    const titleNumB = convertBengaliToEnglishNumerals(b.title);

    if (titleNumA !== titleNumB) {
      return titleNumA - titleNumB;
    }

    // ৩. সম্পূর্ণ সমান বা সংখ্যা না থাকলে বর্ণানুক্রমিক (Alphabetical) সর্ট
    return a.title.localeCompare(b.title, "bn", { numeric: true, sensitivity: "base" });
  });
};