import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { Container } from '../components/container';
import { MorePosts } from '../components/more-posts';
import { Navbar } from '../components/navbar';
import { Footer } from '../components/footer';
import { Layout } from '../components/layout';
import { AppProvider } from '../components/contexts/appContext';
import { PostFragment, PublicationFragment } from '../generated/graphql';
import request, { gql } from 'graphql-request';
import React, { useState, useEffect } from 'react';
import { Meta } from '../components/meta';

const baseUrl = typeof window !== 'undefined' 
  ? window.location.origin 
  : process.env.NEXT_PUBLIC_BASE_URL || 'https://blog.temizmama.com';
  
const GQL_ENDPOINT = process.env.NEXT_PUBLIC_HASHNODE_GQL_ENDPOINT;

const GET_CAT_POSTS = gql`
  query GetCatPosts($host: String!, $first: Int!) {
    publication(host: $host) {
      id
      title
      displayTitle
      url
      isTeam
      author {
        name
        username
        profilePicture
      }
      preferences {
        logo
        darkMode {
          logo
        }
        navbarItems {
          id
          type
          label
          url
        }
      }
      posts(first: $first) {
        edges {
          node {
            id
            title
            brief
            slug
            coverImage {
              url
            }
            publishedAt
            author {
              name
              profilePicture
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

type GetCatPostsResponse = {
  publication: PublicationFragment & {
    posts: {
      edges: Array<{
        node: PostFragment;
      }>;
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
      };
    };
  };
};

type Props = {
  allPosts: PostFragment[];
  publication: PublicationFragment;
  currentPage?: number;
};

const catKeywords = ['kedi', 'kedicik', 'kediş', 'miyav', 'kedi maması', 'kedi bakımı'];

function isCatRelated(post: PostFragment): boolean {
  const content = ((post.title || '') + ' ' + (post.brief || '')).toLowerCase();
  return catKeywords.some(keyword => content.normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(keyword));
}

const POSTS_PER_PAGE = 12;

export default function KediPage({ allPosts, publication, currentPage = 1 }: Props) {
  const [displayedPosts, setDisplayedPosts] = useState<PostFragment[]>([]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
    const endIndex = startIndex + POSTS_PER_PAGE;
    setDisplayedPosts(allPosts.slice(startIndex, endIndex));
  }, [currentPage, allPosts]);

  const hasMorePosts = currentPage * POSTS_PER_PAGE < allPosts.length;
  const hasPreviousPage = currentPage > 1;
  
    return (
      <AppProvider publication={publication}>
        <Layout>
        <Head>
          <title>{`Kediler Hakkında Bilgiler | Kedi Sağlığı, Bakımı & Fazlası ${currentPage > 1 ? `| Sayfa ${currentPage}` : ''} | Temizmama Blog`}</title>            
          <link rel="icon" href="/favicon.ico" />
          <meta name="description" content="Kediler hakkında öğrenmek istedikleriniz Temizmama Blog'da! Kedi sağlığı, kedi bakımı, kedi beslenmesi, kediler hakkında ilginç bilgiler ve fazlası burada!" />
          <meta property="og:url" content={`${baseUrl}/kedi${currentPage > 1 ? `/sayfa/${currentPage}` : ''}`} />
          <meta property="og:image" content={`${baseUrl}/assets/blog/cats/1.png`} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:alt" content="Kediler Hakkında Bilgiler" />
          <meta property="og:type" content="website" />  
          <link 
            rel="canonical" 
            href={`${baseUrl}/kedi${currentPage > 1 ? `/sayfa/${currentPage}` : ''}`} 
          />
          <Meta />
          <script type="application/ld+json">
            {`
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [{
                  "@type": "Question",
                  "name": "Kediler neden hapşırır?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Kediler çeşitli nedenlerle hapşırabilirler: Toz, alerji, enfeksiyon ya da yabancı cisimler… Eğer hapşırık sık ve şiddetliyse veteriner kontrolü önemlidir çünkü altta yatan bir sağlık sorunu olabilir."
                  }
                }, {
                  "@type": "Question",
                  "name": "Kediler neden mırlar?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Kediler mırlayarak rahatladıklarını, mutlu olduklarını veya acı çektiklerini gösterebilirler. Genellikle huzur içinde mırıldasalar da mırıldama bazen stres veya hastalık belirtisi de olabilir; dikkat edilmelidir."
                  }
                }, {
                  "@type": "Question",
                  "name": "Kedimin tüyleri neden dökülüyor?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Mevsimsel tüy dökülmesi normaldir. Ancak aşırı tüy kaybı beslenme sorunları, alerji veya stres kaynaklı olabilir. Düzenli tarama ve veteriner kontrolü tüy dökülmesini yönetmede faydalıdır."
                  }
                }, {
                  "@type": "Question",
                  "name": "Kedim neden sürekli uyuyor?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Kediler günde ortalama 12-16 saat uyurlar. Avcı atalarından gelen bir özelliktir ve böyle enerji biriktirirler. Ancak fazla uyuma tiroid sorunları gibi sağlık sorunlarının da belirtisi olabilir."
                  }
                }, {
                  "@type": "Question",
                  "name": "Kediler neden miyavlar?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Kediler ihtiyaçlarını ve duygularını ifade etmek için miyavlar. Açlık, ilgi çekme, stres veya rahatsızlık gibi nedenlerle bu sesi çıkarabilirler. Sürekli ve aşırı miyavlama ise bir sağlık sorununun belirtisi olabilir."
                  }
                }]
              }
            `}
          </script>
          </Head>
          <Navbar />
          <div className="container mx-auto flex flex-col items-stretch gap-10 px-5 pb-10 pt-40 ">
            <Container>
              <h1 className="text-5xl text-gray-900 font-semibold mt-2 mb-5 text-center">Kediler Hakkında {currentPage > 1 ? `- Sayfa ${currentPage}` : ''}</h1>
            </Container>
          </div>
          <div className="container left-0 right-0 top-0 z-50 mx-auto w-full select-none px-4 py-4 transition-all duration-500 translate-y-0 -mt-32 pt-24 sm:pt-7">
          <Container>
            {displayedPosts.length > 0 ? (
              <>
                <MorePosts posts={displayedPosts} context="home" pageType="kedi" />
                <div className="mt-12 mb-8 flex justify-center space-x-4">
                  {currentPage === 1 ? (
                    hasMorePosts && (
                      <Link href={`/kedi/sayfa/${currentPage + 1}`}>
                        <a className="px-6 py-3 bg-orng-501 text-white rounded-full hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:scale-105">
                          Daha Fazla
                        </a>
                      </Link>
                    )
                  ) : (
                    <>
                      {hasPreviousPage && (
                        <Link href={currentPage === 2 ? '/kedi' : `/kedi/sayfa/${currentPage - 1}`}>
                          <a className="px-6 py-3 bg-orng-501 text-white rounded-full hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:scale-105">
                            ← Önceki Sayfa
                          </a>
                        </Link>
                      )}
                      {hasMorePosts && (
                        <Link href={`/kedi/sayfa/${currentPage + 1}`}>
                          <a className="px-6 py-3 bg-orng-501 text-white rounded-full hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:scale-105">
                            Sonraki Sayfa →
                          </a>
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </>
            ) : (
              <></>
            )}
          </Container>
          </div>
          <Footer />
        </Layout>
      </AppProvider>
    );
  }

export const getStaticProps: GetStaticProps = async () => {
  if (!GQL_ENDPOINT) {
    console.error('GQL_ENDPOINT is not defined');
    return { props: { allPosts: [], publication: {}, currentPage: 1 }, revalidate: 60 };
  }

  try {
    const data = await request<GetCatPostsResponse>(
      GQL_ENDPOINT,
      GET_CAT_POSTS,
      {
        host: process.env.NEXT_PUBLIC_HASHNODE_PUBLICATION_HOST || '',
        first: 100, // Daha fazla post çekmek için bu sayıyı artırabilirsiniz
      }
    );

    const filteredPosts = data.publication.posts.edges
      .map((edge: { node: PostFragment }) => edge.node)
      .filter(isCatRelated);

    return {
      props: {
        allPosts: filteredPosts,
        publication: data.publication,
        currentPage: 1,
      },
      revalidate: 3600,
    };
  } catch (error) {
    console.error('Veri alımı sırasında hata oluştu:', error);
    return { props: { allPosts: [], publication: {}, currentPage: 1 }, revalidate: 60 };
  }
};