// app/lib/normalizeHelpers.ts

// ১. বাংলা ও ইংরেজি টেক্সট নরম্যালাইজেশন (স্পেস, চিহ্ন, নুকতা, স্বরচিহ্ন ও কেস ক্লিন করা)
export const normalizeKey = (text: string): string => {
    if (!text || typeof text !== "string") return "";
    return text
        .normalize("NFC")
        .toLowerCase()
        // সুনির্দিষ্ট ক্যারেক্টার ও স্বরচিহ্ন নরম্যালাইজেশন
        .replace(/ি/g, "ী") // হ্রস্ব-ই (ি) কে দীর্ঘ-ই (ী) তে পরিবর্তন
        .replace(/্/g, "্‌") // সাধারণ হসন্ত কে জিরো-উইডথ হসন্ত (্‌) এ পরিবর্তন
        .replace(/ব়/g, "র") // ব় কে র তে পরিবর্তন
        .replace(/য়/g, "য়") // য় অপরিবর্তিত
        .replace(/ড়/g, "ড়") // ড় অপরিবর্তিত
        .replace(/ঢ়/g, "ঢ়") // ঢ় অপরিবর্তিত
        .replace(/়/g, "") // যেকোনো অবশিষ্ট নুকতা রিমুভ
        // স্পেস, হাইফেন, আন্ডারস্কোর, ড্যাশ এবং সকল ধরণের স্পেশাল ক্যারেক্টার / বিরামচিহ্ন রিমুভ
        .replace(/[\s\-_–—\.,'\/\(\)\[\]\{\}\?\!:]+/g, "")
        .trim();
};

// ২. অবজেক্ট বা নেস্টেড অ্যারে থেকে আইটেম ও সিরিজের নাম এক্সট্র্যাক্ট করার সেফ ফাংশন
export const extractCleanNames = (rawInput: any): string[] => {
    if (!rawInput) return [];
    const namesSet = new Set<string>();

    const process = (val: any) => {
        if (!val) return;
        if (typeof val === "string" && val.trim()) {
            namesSet.add(val.trim());
        } else if (Array.isArray(val)) {
            val.forEach(process);
        } else if (typeof val === "object" && val !== null) {
            const found =
                val.name || val.title || val.label || val.type || val.item || val.slug;
            if (found && typeof found === "string" && found.trim()) {
                namesSet.add(found.trim());
            }
        }
    };

    process(rawInput);
    return Array.from(namesSet);
};