[![CI](https://github.com/Many-Monkeys/gatsby-plugin-ghost-syndicate-medium/actions/workflows/main.yml/badge.svg)](https://github.com/Many-Monkeys/gatsby-plugin-ghost-syndicate-medium/actions/workflows/main.yml)
# gatsby-plugin-ghost-syndicate-medium
Syndicate blog articles to Medium from your gatsby/ghost blog

## How to use this plugin
1. install the package eg `npm i @many-monkeys/gatsby-plugin-ghost-syndicate-medium`
2. add the following to your `gatsby-config.js`

```js
        {
            resolve: `@many-monkeys/gatsby-plugin-ghost-syndicate-medium`,
            options: {
                apiToken: `your-medium-integration-token`,  // see https://medium.com/me/settings
                blogUrl: `https://yourblog.com`,            // the host name of your blog
                syndicationTag: `#medium`,                  // a tag (public or internal) to control access to which articles are syndicated - default null means all articles are considered
                age: 300,                                   // how recent an article (updated) should be to be considered for syndication, between 180 and 3600 seconds, default 300
                continueOnFailure: false,                   // allow publish to continue if failure occurs during syndication, default true
            },
        },
```

## Caveats

1. Articles are only published in draft mode, you will need to login into medium to complete the publish
2. There is no API ([medium](https://github.com/Medium/medium-api-docs)) to list published articles or to update existing ones and so it is possible (probable) that you'll have multiple articles with the same name; this is why all articles are currently published as draft (*).
3. Internal tags (those beginning with #) are removed from the post
4. Medium has rate limiting in place - this is not yet handled as it is rare that more than a few articles would be updated at a time.