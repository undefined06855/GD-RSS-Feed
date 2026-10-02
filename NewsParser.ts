import { Result } from "result-js";

export class NewsImage {
    imageUrl: string = `${process.env.RSS_ENDPOINT}/no-image.png`;
    width: number = -1;
    height: number = -1;
    unknown: number = -1;
    link: string | undefined = "";

    static parse(data: string): Result<NewsImage> {
        let ret = new NewsImage();
        let chunks = data.split(",");

        if (chunks.length != 5 && chunks.length != 4) {
            console.warn(`Invalid news image data chunk length ${chunks.length}: ${data}`);
            return Result.err(`invalid news image chunk data length ${chunks.length}`);
        }

        ret.imageUrl = chunks[0]!;
        ret.width = parseInt(chunks[1]!);
        ret.height = parseInt(chunks[2]!);
        ret.unknown = parseInt(chunks[3]!);
        ret.link = chunks[4];

        return Result.ok(ret);
    }
}

export class NewsBody {
    content: string = "";
    image: NewsImage | null = null;

    static parse(data: string): Result<NewsBody> {
        let ret = new NewsBody();
        let chunks = data.split("~");

        for (let chunk of chunks) {
            let [ id, ..._contents ] = chunk.split(",");
            let contents = _contents.join(",");

            if (!id || !contents) {
                console.warn(`Invalid news body chunk data ${chunk}!`);
                return Result.err("invalid news body chunk data");
            }

            let type = parseInt(id);
            switch (type) {
                case 0: {
                    ret.content = atob(contents);
                } break;

                case 1: {
                    let newsImage = NewsImage.parse(contents);
                    if (newsImage.isErr()) break;
                    ret.image = newsImage.unwrap();
                } break;
            }
        }

        return Result.ok(ret);
    }
}

export class NewsEntry {
    index: number = -1;
    title: string = "(untitled)";
    date: Date = new Date();
    body: NewsBody = new NewsBody();

    static parse(data: string): Result<NewsEntry> {
        let ret = new NewsEntry();
        let chunks = data.split(";");

        for (let chunk of chunks) {
            let [ id, ..._contents ] = chunk.split(":");
            let contents = _contents.join(":");

            if (!id || !contents) {
                console.warn(`Invalid news entry chunk data ${chunk}!`);
                return Result.err("invalid news entry chunk data");
            }

            let type = parseInt(id);
            switch (type) {
                case 1: {
                    ret.index = parseInt(contents);
                } break;

                case 2: {
                    ret.date = new Date(atob(contents));
                } break;

                case 3: {
                    ret.title = atob(contents);
                } break;

                case 4: {
                    let newsBody = NewsBody.parse(contents);
                    if (newsBody.isErr()) break;
                    ret.body = newsBody.unwrap();
                } break;

                default: {
                    console.warn(`Unknown chunk type ${type}: ${contents}`);
                }
            }
        }

        return Result.ok(ret);
    }
}

export class News {
    news: Array<NewsEntry> = [];

    static parse(data: string): Result<News> {
        let ret = new News();
        let chunks = data.split("|");

        let first = chunks.shift();

        if (!first) {
            console.warn(`No chunks in news data: ${data}!`);
            return Result.err("no chunks");
        }

        let [ unknown, total ] = first.split(",");
        if (!unknown || !total) {
            console.warn(`Invalid starting chunk: ${first}!`);
            return Result.err("invalid starting chunk");
        }

        ret.news = chunks.map(chunk => NewsEntry.parse(chunk)).filter(chunk => chunk.isOk()).map(chunk => chunk.unwrap())

        return Result.ok(ret);
    }
};

export default class NewsParser {
    url: string;

    constructor(url = "https://geometrydashfiles.b-cdn.net/news/news.dat") {
        this.url = url;
    }

    async fetch(): Promise<Result<News>> {
        let res = await fetch(this.url);
        if (res.status != 200) {
            console.warn(`Unexpected response code from GD: ${res.status}!`);
            return Result.err(`unexpected response code from cdn ${res.status}`);
        }

        let data = new TextDecoder().decode(Bun.gunzipSync(Uint8Array.fromBase64(await res.text(), { alphabet: "base64url" })));
        return News.parse(data);
    }
};
