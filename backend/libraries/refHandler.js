const Post = require(`${global.dirs.apps.be.post}/model`);

exports.deleteRefs = async (ref) => {
  const refPosts = await Post.find().exists(`references.${ref}`);
  for (const post of refPosts) {
      post.references.delete(ref);
      await post.save();
  }
};

exports.editRefs = async (oldRef, newRef) => {
  const refPosts = await Post.find().exists(`references.${oldRef}`);
  const newUrl = `/${oldRef[1] === "u" ? "user" : "channel"}/${encodeURIComponent(newRef.replace(/!/g, "")).slice(1)}`;
  for (const post of refPosts) {
      post.content = post.content.replace(oldRef, newRef);
      post.references.delete(oldRef);
      post.references.set(newRef, newUrl);
      await post.save();
  }
};