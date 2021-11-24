const axios = require('axios');
const { DateTime } = require('luxon');

const syndicationQuery = `
{
  pages: allGhostPost {
    edges {
      node {
        slug
        title
        updated_at
        url
        published_at
        html
        tags {
          name
          visibility
        }
        visibility
        feature_image
      }
    }
  }
}`

const pageToMediumRecord = (blogUrl) => ({ node: { id, title, html, tags, slug, feature_image, ...rest } }) => {
  const visibleTags = tags
    .filter(tag => tag.visibility === 'public')
    .map(tag => tag.name);

  const allTags = tags
    .map(tag => tag.name);

  const canonicalUrl = `${blogUrl}/${slug}/`;

  return {
    medium: {
      title,
      contentFormat: 'html',
      publishStatus: 'draft',
      content: `<img src="${feature_image}" alt="${title}"/>${html}`,
      tags: visibleTags,
      canonicalUrl: canonicalUrl,
    },
    tags: allTags,
    ...rest,
  }
}

const queries = {
  query: syndicationQuery,
  transformer: (blogUrl, { data }) => data.pages.edges.map(pageToMediumRecord(blogUrl))
}

const getMyProfile = async (apiToken) => {
  const res = await axios.get('https://api.medium.com/v1/me', {
    headers: { 'Authorization': 'Bearer ' + apiToken}
  });
  return res.data;
}

const postMediumArticle = async (apiToken, mediumUserId, mediumData) => {
  const res = await axios.post(`https://api.medium.com/v1/users/${mediumUserId}/posts`, mediumData, {
    headers: { 'Authorization': 'Bearer ' + apiToken}
  });
  return res.data;
}

exports.onPostBuild = async function ({ graphql, reporter }, config) {
  const {
    apiToken,
    blogUrl,
    syndicationTag = null,
    age = 300,
    continueOnFailure = true,
  } = config;

  const activity = reporter.activityTimer(`syndication to Medium`);
  activity.start();

  if (continueOnFailure === true && !(apiToken && blogUrl)) {
    activity.setStatus(
      `options.continueOnFailure is true and apiToken or blogUrl is missing; skipping syndication`
    );
    activity.end();
    return;
  }

  try {
    const boundAge = Math.max(Math.min(age, 3600), 180);
    const sinceUTC = DateTime.now().minus({ seconds: boundAge }).toUTC();

    const result = await graphql(queries.query);
    const syndicatedPosts = (await queries.transformer(blogUrl, result))
      .filter(post => post.visibility === 'public')
      .filter(post => !syndicationTag || post.tags.includes(syndicationTag))
      .filter(post => DateTime.fromISO(post.updated_at).toUTC() > sinceUTC)
      .sort((a, b) => b.published_at.localeCompare(a.published_at));

    if (syndicatedPosts.length > 0) {
      const mediumUser = await getMyProfile(apiToken);
      for (let index = 0; index < syndicatedPosts.length; index++) {
        const post = syndicatedPosts[index];
        const res = await postMediumArticle(apiToken, mediumUser.data.id, post.medium);
        console.log(res.data);
      }
    }

    } catch (error) {
      if (continueOnFailure) {
        reporter.warn('failed to syndicate to Medium');
        console.error(error);
      } else {
        activity.panicOnBuild('failed to syndicate to Medium', error);
      }
  }

  activity.end();
};
