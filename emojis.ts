export default class GDEmojis {
    static emojiMap: Record<string, string> = {
        ":party:": "🥳",
        ":eyes:": "👀",
        ":salute:": "🫡",
        ":angel:": "😇",
        ":epic:": "🔥",
        ":yay:": "🎉"
    };

    static replace(text: string): string {
        return text.replaceAll(/:[A-Za-z0-9]+:/g, match => GDEmojis.emojiMap[match] ?? match);
    }
}
