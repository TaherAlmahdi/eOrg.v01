// ১. বাংলা ও ইংরেজি টেক্সট নরম্যালাইজেশন (স্পেস, নুকতা ও কেস ক্লিন করা)
export const normalizeKey = (text: string): string => {
    if (!text || typeof text !== "string") return "";
    return text
        .normalize("NFC")
        .toLowerCase()
        .replace(/য়/g, "য")
        .replace(/ড়/g, "র")
        .replace(/ঢ়/g, "র")
        .replace(/ব়/g, "র")
        .replace(/়/g, "") // নুকতা রিমুভ
        .replace(/[\s\-_]+/g, "") // স্পেস, হাইফেন, আন্ডারস্কোর রিমুভ
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
            const found = val.name || val.title || val.label || val.type || val.item || val.slug;
            if (found && typeof found === "string" && found.trim()) {
                namesSet.add(found.trim());
            }
        }
    };

    process(rawInput);
    return Array.from(namesSet);
};