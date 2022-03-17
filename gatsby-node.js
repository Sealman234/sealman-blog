const path = require('path');

exports.createPages = async ({ graphql, actions, reporter }) => {
  const { createPage } = actions;

  // Query for markdown nodes to use in creating pages.
  const resultPosts = await graphql(
    `
      {
        allMdx(filter: { fileAbsolutePath: { glob: "**/blog/**/*" } }) {
          edges {
            node {
              id
              slug
              body
              frontmatter {
                title
                date(formatString: "YYYY-MM-DD")
                hero_image_alt
                hero_image_credit_link
                hero_image_credit_text
                hero_image {
                  childImageSharp {
                    gatsbyImageData
                  }
                }
              }
            }
          }
        }
      }
    `
  );
  const resultTags = await graphql(
    `
      {
        allMdx(
          filter: { fileAbsolutePath: { glob: "**/blog/**/*" } }
          sort: { fields: frontmatter___date, order: DESC }
        ) {
          group(field: frontmatter___tags) {
            tag: fieldValue
            totalCount
            nodes {
              id
              slug
              frontmatter {
                title
                date(formatString: "YYYY-MM-DD")
                tags
              }
            }
          }
        }
      }
    `
  );

  // Handle errors
  if (resultPosts.errors || resultTags.errors) {
    reporter.panicOnBuild(`Error while running GraphQL query.`);
    return;
  }

  // Make post pages
  const blogPostTemplate = path.resolve(`src/templates/post.js`);

  resultPosts.data.allMdx.edges.forEach(({ node }) => {
    const path = node.slug;
    const data = node;
    createPage({
      path,
      component: blogPostTemplate,
      context: {
        data,
      },
    });
  });

  // Make tag pages
  const TagTemplate = path.resolve(`src/templates/tag.js`);
  resultTags.data.allMdx.group.forEach(async ({ tag, totalCount, nodes }) => {
    const kebab = tag.replace(/\s+/g, '-').toLowerCase();
    const path = `/tags/${kebab}`;
    const posts = nodes;
    createPage({
      path,
      component: TagTemplate,
      context: {
        tag,
        totalCount,
        posts,
      },
    });
  });
};
