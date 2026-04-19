export const GET_BANKIM_BOOKS = `
  query GetBankimBySeries {
    allSeries(where: { slug: ["bankim-rachanabali"] }) {
      nodes {
        name
        eBooks {
          nodes {
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
`;