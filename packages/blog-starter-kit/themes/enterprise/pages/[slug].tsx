import { addArticleJsonLd } from '@starter-kit/utils/seo/addArticleJsonLd';
import { getAutogeneratedPostOG } from '@starter-kit/utils/social/og';
import request from 'graphql-request';
import { gql } from 'graphql-request';
import { GetStaticPaths, GetStaticProps } from 'next';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import CircularProgressBar from '../components/CircularProgressBar';
import { Container } from '../components/container';
import { AppProvider } from '../components/contexts/appContext';
import { Footer } from '../components/footer';
import { Navbar } from "../components/navbar";
import { Layout } from '../components/layout';
import { Integrations } from '../components/integrations';
import { MarkdownToHtml } from '../components/markdown-to-html';
import { PostHeader } from '../components/post-header';
import { PostTOC } from '../components/post-toc';
import ShareButtons from '../components/ShareButtons';
import { MorePosts } from '../components/more-posts';
import { resizeImage } from '@starter-kit/utils/image';
import { DEFAULT_COVER } from '../utils/const';

import {
  PageByPublicationDocument,
  PostFullFragment,
  PublicationFragment,
  SinglePostByPublicationDocument,
  SlugPostsByPublicationDocument,
  StaticPageFragment,
  SeriesFragment,
  SeriesPostsByPublicationDocument,
} from '../generated/graphql';

// @ts-ignore
import handleMathJax from '@starter-kit/utils/handle-math-jax';
import { useEmbeds } from '@starter-kit/utils/renderer/hooks/useEmbeds';
import { loadIframeResizer } from '@starter-kit/utils/renderer/services/embed';
import { useEffect, useState } from 'react';
// @ts-ignore
import { triggerCustomWidgetEmbed } from '@starter-kit/utils/trigger-custom-widget-embed';
import RelatedPosts from '../components/RelatedPosts';

const AboutAuthor = dynamic(() => import('../components/about-author'), { ssr: false });

// Tüm blog yazılarını almak için yeni bir sorgu
const AllPostsByPublicationDocument = gql`
  query AllPostsByPublication($host: String!, $first: Int!) {
    publication(host: $host) {
      posts(first: $first) {
        edges {
          node {
            id
            title
            brief
            slug
            publishedAt
          }
        }
      }
    }
  }
`;

type PostFragment = {
  id: string;
  title: string;
  brief: string;
  slug: string;
  coverImage?: { url: string } | null;
  tags?: Array<{ id: string; name: string; slug: string }> | null;
  content: string;
  publishedAt: string;
};

const removeUndefined = <T extends Record<string, any>>(obj: T): T => {
  Object.keys(obj).forEach(key => {
    if (obj[key] && typeof obj[key] === 'object') {
      removeUndefined(obj[key]);
    } else if (obj[key] === undefined) {
      delete obj[key];
    }
  });
  return obj;
};

type AllPostsByPublicationQuery = {
  publication?: {
    posts: {
      edges: Array<{
        node: PostFullFragment;
      }>;
    };
  };
};

type PostProps = {
  type: 'post';
  post: PostFullFragment;
  publication: PublicationFragment;
  relatedPosts: PostFragment[];
};

type PageProps = {
  type: 'page';
  page: StaticPageFragment;
  publication: PublicationFragment;
};

type CategoryProps = {
  type: 'category';
  series: SeriesFragment;
  posts: PostFullFragment[];
  publication: PublicationFragment;
};

type Props = PostProps | PageProps | CategoryProps;

const Post = ({ publication, post, relatedPosts }: PostProps) => {
  const [, setMobMount] = useState(false);
  const [canLoadEmbeds, setCanLoadEmbeds] = useState(false);
  useEmbeds({ enabled: canLoadEmbeds });

  useEffect(() => {
    if (post.hasLatexInPost) {
      setTimeout(() => {
        handleMathJax(true);
      }, 500);
    }

    if (screen.width <= 425) {
      setMobMount(true);
    }

    if (post) {
      (async () => {
        await loadIframeResizer();
        triggerCustomWidgetEmbed(post.publication?.id.toString());
        setCanLoadEmbeds(true);
      })();
    }
  }, [post]);

  const postTitle = post.seo?.title || post.title;
  const postDescription = post.seo?.description || post.subtitle || post.brief;
  const postImage = post.ogMetaData?.image || post.coverImage?.url || getAutogeneratedPostOG(post, publication);

  return (
    <>
      <Head>
        <title>{`${postTitle}`}</title>
        <link rel="canonical" href={post.url} />
        <meta name="description" content={postDescription} />
        <meta name="Dynamics-Noise" content="Off" />
        <meta httpEquiv="x-dns-prefetch-control" content="on" />
        <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1" />
        <meta name="apple-mobile-web-app-status-bar-style"content="#efdcc9" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <meta name="application-name" content={publication.title} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme" content="#efdcc9" />
        <link rel="manifest" href="/manifest.json" />
        <meta httpEquiv="ScreenOrientation" content="autoRotate:disabled"/>
        <meta name="theme-color" content="#efdcc9" />
        <meta name="msapplication-navbutton-color" content="#efdcc9" />
        <meta name="apple-mobile-web-app-status-bar-style" content="#efdcc9" />
        <meta property="og:locale" content="tr_TR" />
        <meta name="robots" content="max-image-preview:large" />
        <meta property="og:title" content={`${postTitle}`} />
        <meta property="og:description" content={postDescription} />
        <meta property="og:image" content={postImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${postTitle}`} />
        <meta name="twitter:description" content={postDescription} />
        <meta name="twitter:image" content={postImage} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(addArticleJsonLd(publication, post)),
          }}
        />
      </Head>
      
      <PostHeader
        title={post.title}
        coverImage={post.coverImage?.url}
        date={post.publishedAt}
        author={post.author}
      />
      {post.features.tableOfContents.isEnabled && <PostTOC />}
      <MarkdownToHtml contentMarkdown={post.content.markdown} />
      <ShareButtons url={post.url} title={post.title} />
      <AboutAuthor />
      <RelatedPosts 
        currentPost={{
          ...post,
          content: post.content.markdown
        } as PostFragment} 
        allPosts={[
          {
            ...post,
            content: post.content.markdown
          } as PostFragment,
          ...relatedPosts
        ]} 
      />
    </>
  );
};

const Page = ({ page, publication }: PageProps) => {
  return (
    <>
      <Head>
        <title>{`${page.title} - ${publication.title}`}</title>
      </Head>
      <h1>{page.title}</h1>
      <MarkdownToHtml contentMarkdown={page.content.markdown} />
    </>
  );
};

const Category = ({ series, posts, publication }: CategoryProps) => {
  const title = `${series.name} - ${publication.title}`;
  const description = series.description?.html ? stripHtml(series.description.html) : '';
  const coverImage = resizeImage(
    series.coverImage,
    { w: 1200, h: 630, c: 'thumb' },
    DEFAULT_COVER
  );

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "headline": series.name,
    "description": description,
    "image": coverImage,
    "publisher": {
      "@type": "Organization",
      "name": publication.title,
      "logo": {
        "@type": "ImageObject",
        "url": publication.preferences.logo || DEFAULT_COVER
      }
    }
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={coverImage} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${publication.url}/${series.slug}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={coverImage} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>
      <div className="pt-5">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-neutral-50 mb-6">
          {series.name}
        </h1>
        {posts.length > 0 ? (
          <MorePosts context="series" posts={posts} />
        ) : (
          <div>Bu kategoride henüz içerik bulunmuyor...</div>
        )}
      </div>
    </>
  );
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, '').trim();
}

export default function DynamicPage(props: Props) {
  const publication = props.publication;

  return (
    <AppProvider publication={publication} post={props.type === 'post' ? props.post : null} page={props.type === 'page' ? props.page : null} series={props.type === 'category' ? props.series : null}>
      <Layout>
        <Navbar />
        <Container className="pt-101 flex flex-col items-stretch gap-10 px-5 pb-10 pt-28">
          <article className="border-b-1-1/2 flex flex-col items-start gap-10 pb-10">
            {props.type === 'post' && <Post {...props} />}
            {props.type === 'page' && <Page {...props} />}
            {props.type === 'category' && <Category {...props} />}
          </article>
        </Container>
        <CircularProgressBar />
        <Footer />
      </Layout>
      <Integrations />
    </AppProvider>
  );
}

function selectRelatedPosts(currentPost: PostFullFragment, allPosts: PostFullFragment[], count: number): PostFullFragment[] {
  const otherPosts = allPosts.filter(post => post.id !== currentPost.id);

  // İlgili yazıları seç
  const scoredPosts = otherPosts.map(post => ({
    post,
    score: calculateRelatednessScore(currentPost, post)
  }));

  const selectedPosts = scoredPosts
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(item => item.post);

  // Eğer yeterli ilgili yazı yoksa, rastgele yazılarla tamamla
  while (selectedPosts.length < count) {
    const remainingPosts = otherPosts.filter(post => !selectedPosts.includes(post));
    if (remainingPosts.length === 0) break;
    const randomPost = remainingPosts[Math.floor(Math.random() * remainingPosts.length)];
    selectedPosts.push(randomPost);
  }

  return selectedPosts;
}

function calculateRelatednessScore(post1: PostFullFragment, post2: PostFullFragment): number {
  let score = 0;

  // Etiket benzerliği
  const commonTags = post1.tags?.filter(tag1 => 
    post2.tags?.some(tag2 => tag2.name.toLowerCase() === tag1.name.toLowerCase())
  ) || [];
  score += commonTags.length * 2;

  // Başlık benzerliği
  if (post1.title.toLowerCase().includes(post2.title.toLowerCase()) ||
      post2.title.toLowerCase().includes(post1.title.toLowerCase())) {
    score += 3;
  }

  // Yayın tarihi yakınlığı
  const date1 = new Date(post1.publishedAt);
  const date2 = new Date(post2.publishedAt);
  const daysDifference = Math.abs((date1.getTime() - date2.getTime()) / (1000 * 3600 * 24));
  if (daysDifference < 30) {
    score += (30 - daysDifference) / 10;
  }

  return score;
}

type Params = {
  slug: string;
};

export const getStaticProps: GetStaticProps<Props, Params> = async ({ params }) => {
  if (!params) {
    throw new Error('No params');
  }
  
  const endpoint = process.env.NEXT_PUBLIC_HASHNODE_GQL_ENDPOINT;
  const host = process.env.NEXT_PUBLIC_HASHNODE_PUBLICATION_HOST;
  const slug = params.slug;
  
  try {
    // Post için kontrol
    const postData = await request(endpoint, SinglePostByPublicationDocument, { host, slug });
    
    if (postData.publication?.post) {
      const currentPost = postData.publication.post;
      
      // Tüm blog yazılarını almaya çalış, hata olursa boş dizi kullan
      let allPosts: PostFullFragment[] = [];
      try {
        const allPostsData = await request<AllPostsByPublicationQuery>(endpoint, AllPostsByPublicationDocument, { host, first: 100 });
        allPosts = allPostsData.publication?.posts.edges.map((edge) => edge.node) || [];
      } catch (error) {
        console.error('Error fetching all posts:', error);
        // Hata durumunda ilgili yazıları boş dizi olarak bırak
      }

      // İlgili yazıları seç (mevcut yazı ve varsa diğer yazılar arasından)
      const relatedPosts = selectRelatedPosts(currentPost, allPosts, 3);

      const formattedRelatedPosts: PostFragment[] = relatedPosts.map(post => ({
        id: post.id,
        title: post.title,
        brief: post.brief,
        slug: post.slug,
        coverImage: post.coverImage ? { url: post.coverImage.url || '' } : null,
        tags: post.tags ? post.tags.map(tag => ({
          id: tag.id,
          name: tag.name,
          slug: tag.slug
        })) : null,
        content: post.content?.markdown || '',
        publishedAt: post.publishedAt
      }));
      
      return {
        props: removeUndefined({
          type: 'post',
          post: currentPost,
          publication: postData.publication,
          relatedPosts: formattedRelatedPosts,
        }),
        revalidate: 1,
      };
    }

    // Statik sayfa için kontrol
    const pageData = await request(endpoint, PageByPublicationDocument, { host, slug });

    if (pageData.publication?.staticPage) {
      return {
        props: removeUndefined({
          type: 'page',
          page: pageData.publication.staticPage,
          publication: pageData.publication,
        }),
        revalidate: 1,
      };
    }

    // Kategori (series) için kontrol
    const seriesData = await request(endpoint, SeriesPostsByPublicationDocument, {
      host,
      seriesSlug: slug,
      first: 20,
    });

    if (seriesData.publication?.series) {
      const series = seriesData.publication.series;
      const posts = series.posts.edges.map(edge => edge.node) as PostFullFragment[];

      return {
        props: removeUndefined({
          type: 'category',
          series,
          posts,
          publication: seriesData.publication,
        }),
        revalidate: 1,
      };
    }

    // Hiçbir koşul sağlanmazsa 404 döndür
    return {
      notFound: true,
      revalidate: 1,
    };

  } catch (error) {
    console.error('Error in getStaticProps:', error);
    return { 
      notFound: true,
      revalidate: 1
    };
  }
};

export const getStaticPaths: GetStaticPaths = async () => {
  const data = await request(
    process.env.NEXT_PUBLIC_HASHNODE_GQL_ENDPOINT,
    SlugPostsByPublicationDocument,
    {
      first: 10,
      host: process.env.NEXT_PUBLIC_HASHNODE_PUBLICATION_HOST,
    },
  );

  const postSlugs = (data.publication?.posts.edges ?? []).map((edge) => edge.node.slug);

  return {
    paths: postSlugs.map((slug) => {
      return {
        params: {
          slug: slug,
        },
      };
    }),
    fallback: 'blocking',
  };
};