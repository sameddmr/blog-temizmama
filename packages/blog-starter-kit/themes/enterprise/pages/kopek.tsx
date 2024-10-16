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
import React, { useState, useEffect, useMemo } from 'react';
import { Meta } from '../components/meta';

const baseUrl = typeof window !== 'undefined' 
  ? window.location.origin 
  : process.env.NEXT_PUBLIC_BASE_URL || 'https://blog.temizmama.com';

type ExtendedPostFragment = PostFragment & {
    tags?: Array<{ name: string }>;
  };
const GQL_ENDPOINT = process.env.NEXT_PUBLIC_HASHNODE_GQL_ENDPOINT;

const GET_DOG_POSTS = gql`
  query GetDogPosts($host: String!, $first: Int!) {
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
            tags {
              name
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

type GetDogPostsResponse = {
    publication: PublicationFragment & {
      posts: {
        edges: Array<{
          node: ExtendedPostFragment;
        }>;
        pageInfo: {
          hasNextPage: boolean;
          endCursor: string | null;
        };
      };
    };
  };
  
  type Props = {
    allPosts: ExtendedPostFragment[];
    publication: PublicationFragment;
    currentPage?: number;
  };
  
  function isDogRelated(post: PostFragment): boolean {
    const content = (post.title + ' ' + post.brief).toLowerCase();
    
    const dogKeywords = [
      'köpek', 'köpekcik', 'köpüş', 'hav', 'köpek maması', 'köpek bakımı', 
      'dog', 'puppy', 'canine', 'yavru köpek', 'köpek eğitimi', 'köpek sağlığı'
    ];
    
    const catKeywords = [
      'kedi', 'kedici', 'kedi maması', 'kedi bakımı', 'cat', 'kitten', 'feline',
      'miyav', 'yavru kedi', 'kedi eğitimi', 'kedi sağlığı'
    ];
    
    const commonKeywords = [
      'evcil hayvan', 'pet', 'hayvan bakımı', 'hayvan sağlığı', 
      'veteriner', 'mama', 'tasma', 'oyuncak', 'tırnak kesimi',
      'tüy bakımı', 'hayvan davranışları', 'evcil hayvan eğitimi', 'barf', 'kanun'
    ];
  
    const hasDogKeyword = dogKeywords.some(keyword => content.includes(keyword));
    const hasCatKeyword = catKeywords.some(keyword => content.includes(keyword));
    const hasCommonKeyword = commonKeywords.some(keyword => content.includes(keyword));
  
    return (hasDogKeyword && !hasCatKeyword) || (hasDogKeyword && hasCatKeyword && hasCommonKeyword);
  }
  
  const POSTS_PER_PAGE = 12;
  
  export default function KopekPage({ allPosts, publication, currentPage = 1 }: Props) {
    const [displayedPosts, setDisplayedPosts] = useState<PostFragment[]>([]);
  
    const dogRelatedPosts = useMemo(() => allPosts.filter(isDogRelated), [allPosts]);
  
    useEffect(() => {
      const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
      const endIndex = startIndex + POSTS_PER_PAGE;
      setDisplayedPosts(dogRelatedPosts.slice(startIndex, endIndex));
    }, [currentPage, dogRelatedPosts]);
  
    const hasMorePosts = currentPage * POSTS_PER_PAGE < dogRelatedPosts.length;
    const hasPreviousPage = currentPage > 1;
  
    return (
      <AppProvider publication={publication}>
        <Layout>
        <Head>
          <title>{`Köpekler Hakkında Bilgiler | Köpek Sağlığı, Bakımı & Fazlası ${currentPage > 1 ? `| Sayfa ${currentPage}` : ''} | Temizmama Blog`}</title>
          <meta name="description" content="Köpekler hakkında öğrenmek istedikleriniz Temizmama Blog'da! Köpek ırkları, köpek bakımı, köpek beslenmesi, köpekler hakkında ilginç bilgiler burada!" />
          <meta property="og:url" content={`${baseUrl}/kopek${currentPage > 1 ? `/sayfa/${currentPage}` : ''}`} />
          <meta property="og:image" content={`${baseUrl}/assets/blog/dogs/1.png`} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:alt" content="Köpekler Hakkında Bilgiler" />
          <meta property="og:type" content="website" />  
          <Meta />
          <link rel="icon" href="/favicon.ico" />
          <link 
            rel="canonical" 
            href={`${baseUrl}/kopek${currentPage > 1 ? `/sayfa/${currentPage}` : ''}`} 
          />
          <script type="application/ld+json">
            {`
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [{
                  "@type": "Question",
                  "name": "Köpeğim neden kusuyor?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Köpekler bazen hızlı yemek yeme, mide tahrişi veya stres nedeniyle kusabilirler. Ancak sık kusma ciddi bir sağlık sorununun belirtisi olabilir ve veteriner kontrolü gerektirir."
                  }
                }, {
                  "@type": "Question",
                  "name": "Köpeğim neden sürekli kaşınıyor?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Kaşıntı, alerji, parazitler veya deri enfeksiyonları gibi sorunlardan kaynaklanabilir. Kaşıntı sürekli hale gelirse altta yatan nedenleri bulmak için veterinere başvurmak gereklidir."
                  }
                }, {
                  "@type": "Question",
                  "name": "Köpekler çikolata yerse ne olur?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Çikolata köpekler için toksiktir. Yedikleri miktar ve çikolatanın türüne göre mide sorunları, nörolojik belirtiler veya ciddi durumlarda ölümcül olabilir."
                  }
                }, {
                  "@type": "Question",
                  "name": "Köpekler ne kadar yaşar?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Köpeklerin ömrü genellikle 10-15 yıl arasında değişir ancak ırk, genetik ve yaşam koşullarına göre farklılık gösterir. Küçük cins köpekler genellikle daha uzun yaşarlar."
                  }
                }, {
                  "@type": "Question",
                  "name": "Köpekler neden hırlar?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Köpekler genellikle tehdit algıladıklarında ya da korktuklarında hırlarlar. Ayrıca sahiplerini veya alanlarını koruma amacıyla da hırlayabilirler. Hırlama bir uyarı işaretidir ve dikkatle ele alınmalıdır."
                  }
                }]
              }
            `}
          </script>
          </Head>
        <Navbar />
        <div className="container mx-auto flex flex-col items-stretch gap-10 px-5 pb-10 pt-40">
          <Container>
            <h1 className="text-5xl text-gray-900 font-semibold mt-2 mb-5 text-center">Köpekler Hakkında {currentPage > 1 ? `- Sayfa ${currentPage}` : ''}</h1>
          </Container>
        </div>
        <div className="container left-0 right-0 top-0 z-50 mx-auto w-full select-none px-4 py-4 transition-all duration-500 translate-y-0 -mt-32 pt-24 sm:pt-7">
        <Container>
          {displayedPosts.length > 0 ? (
            <>
              <MorePosts posts={displayedPosts} context="home" pageType="kopek" />
              <div className="mt-12 mb-8 flex justify-center space-x-4">
                {currentPage === 1 ? (
                  hasMorePosts && (
                    <Link href={`/kopek/sayfa/${currentPage + 1}`}>
                      <a className="px-6 py-3 bg-orng-501 text-white rounded-full hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:scale-105">
                        Daha Fazla
                      </a>
                    </Link>
                  )
                ) : (
                  <>
                    {hasPreviousPage && (
                      <Link href={currentPage === 2 ? '/kopek' : `/kopek/sayfa/${currentPage - 1}`}>
                        <a className="px-6 py-3 bg-orng-501 text-white rounded-full hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:scale-105">
                          ← Önceki Sayfa
                        </a>
                      </Link>
                    )}
                    {hasMorePosts && (
                      <Link href={`/kopek/sayfa/${currentPage + 1}`}>
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
            <p>Henüz köpek ile ilgili içerik bulunmamaktadır.</p>
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
      const data = await request<GetDogPostsResponse>(
        GQL_ENDPOINT,
        GET_DOG_POSTS,
        {
          host: process.env.NEXT_PUBLIC_HASHNODE_PUBLICATION_HOST || '',
          first: 100, // Daha fazla post çekmek için bu sayıyı artırabilirsiniz
        }
      );
  
      const allPosts = data.publication.posts.edges.map((edge: { node: PostFragment }) => edge.node);
      console.log(`Toplam makale sayısı: ${allPosts.length}`);
  
      const filteredPosts = allPosts.filter(isDogRelated);
      console.log(`Köpeklerle ilgili makale sayısı: ${filteredPosts.length}`);
  
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