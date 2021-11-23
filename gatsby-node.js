exports.onPostBuild = async function ({ graphql, reporter }, config) {
  const {
    apiToken,
    continueOnFailure = true,
  } = config;

  const activity = reporter.activityTimer(`syndication to Medium`);
  activity.start();

  if (continueOnFailure === true && !(apiToken)) {
    activity.setStatus(
      `options.continueOnFailure is true and apiToken is missing; skipping syndication`
    );
    activity.end();
    return;
  }

  activity.end();
};