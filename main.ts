import NewsParser from "./NewsParser";
import { Feed } from "feed";

let error: string | undefined;
let feed: Feed | undefined;

async function fetchNews() {
    let parser = new NewsParser();

    feed = error = undefined;

    let res = await parser.fetch();
    if (res.isErr()) {
        console.warn("There was an error when generating!");
        error = res.unwrapErr();
        return;
    }

    feed = new Feed({
        id: process.env.RSS_ENDPOINT,
        title: "Geometry Dash News",
        description: `A feed taken from the 2.209 News button in the bottom right. Re-fetches from GD servers every ${process.env.FETCH_INTERVAL} minutes.`,
        generator: "https://github.com/undefined06855/GD-RSS-Feed",
        language: "en",

        ttl: 30, // refresh every 30 mins for clients

        link: process.env.RSS_ENDPOINT,
        feedLinks: {
            json: `${process.env.RSS_ENDPOINT}/json`,
            atom: `${process.env.RSS_ENDPOINT}/atom`,
            rss: `${process.env.RSS_ENDPOINT}/feed`
        },
        author: { name: "RobTop" },
        favicon: `${process.env.RSS_ENDPOINT}/gd-logo.png`,
        category: "Gaming" // rss has no defined category names so maybe this is good?
    });

    feed.addContributor({
        name: "undefined0",
        link: "https://github.com/undefined06855"
    })

    let news = res.unwrap().news;
    for (let entry of news) {
        feed.addItem({
            title: entry.title,
            guid: entry.index.toString(),
            link: entry.body.image?.link ?? "",
            date: entry.date,
            content: entry.body.content,
            image: entry.body.image?.imageUrl,
            published: entry.date
        });
    }
}

Bun.cron(`*/${process.env.FETCH_INTERVAL} * * * *`, fetchNews);
await fetchNews();


let server = Bun.serve({
    routes: {
        "/gd-logo.png": Bun.file("./gd-logo.png"),

        "/feed": () => { return new Response(feed?.rss2() ?? error, { headers: { "Content-Type": "application/xml" } }); },
        "/rss": () => { return new Response(feed?.rss2() ?? error, { headers: { "Content-Type": "application/xml" } }); },
        "/json": () => { return new Response(feed?.json1() ?? error); },
        "/atom": () => { return new Response(feed?.atom1() ?? error); },
    }
});

console.log(`Serving RSS feed on port ${server.port} at /feed`);
