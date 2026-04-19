export const GET_BANKIM_BOOKS = `
  query GetBankimBySeries {
    allSeries(where: { slug: ["bankim-rachanabali"] }) {
      nodes {
        name
        contentNodes(first: 50) {
          nodes {
            ... on EBook {
              title
              slug
              featuredImage {
                node {
                  sourceUrl
                }
              }
            }
          }
        }
      }
    }
  }
`;