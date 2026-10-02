# GD RSS Feed

An RSS feed for the new 2.209 News button!

To setup, clone this repository, create a `.env` file with the following set:
```env
RSS_ENDPOINT=https://gd-news.undefined0.dev     # URL of your site without the trailing slash
FETCH_INTERVAL=30                               # How often to fetch from GD servers
PORT=8080
```
...run `bun i` to install dependencies and `bun main` to start.

This project was created using `bun init` in bun v1.4.3. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
