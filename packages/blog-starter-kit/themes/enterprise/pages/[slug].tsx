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
const PostComments = dynamic(() =>
  import('../components/post-comments').then((mod) => mod.PostComments),
);

export const PostsByTagDocument = gql`
  query PostsByTag($host: String!, $tagSlugs: [String!], $first: Int!, $after: String) {
    publication(host: $host) {
      posts(first: $first, after: $after, filter: { tagSlugs: $tagSlugs }) {
        edges {
          node {
            id
            title
            brief
            slug
            coverImage {
              url
            }
            author {
              name
              profilePicture
            }
            publishedAt
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

type PostsByTagQuery = {
  publication?: {
    posts: {
      edges: Array<{
        node: RelatedPostFragment;
      }>;
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
      };
    };
  };
};

type RelatedPostFragment = {
  id: string;
  title: string;
  brief: string;
  slug: string;
  coverImage?: { url: string } | null;
  author: { name: string; profilePicture?: string | null };
  publishedAt: string;
};

type PostProps = {
  type: 'post';
  post: PostFullFragment;
  publication: PublicationFragment;
  relatedPosts: RelatedPostFragment[];
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
        <meta property="og:title" content={`${postTitle}`} />
        <meta property="og:description" content={postDescription} />
        <meta property="og:image" content={postImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${postTitle}`} />
        <meta name="twitter:description" content={postDescription} />
        <meta name="twitter:image" content={postImage} />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
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
      {!post.preferences.disableComments && post.comments.totalDocuments > 0 && <PostComments />}
      {relatedPosts && relatedPosts.length > 0 && <RelatedPosts posts={relatedPosts} />}
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
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
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

// HTML'den metin çıkarmak için yardımcı fonksiyon
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, '').trim();
}

export default function DynamicPage(props: Props) {
  const publication = props.publication;

  return (
    <AppProvider publication={publication} post={props.type === 'post' ? props.post : null} page={props.type === 'page' ? props.page : null} series={props.type === 'category' ? props.series : null}>
      <Layout>
        <Navbar />
        <Container className="pt-101 flex flex-col items-stretch gap-10 px-5 pb-10 select-none pt-28">
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
  
  // Post için kontrol
  const postData = await request(endpoint, SinglePostByPublicationDocument, { host, slug });
  
  if (postData.publication?.post) {
    const currentPost = postData.publication.post;
    const tagSlugs = currentPost.tags?.map(tag => tag.slug) || [];

    let allRelatedPosts: RelatedPostFragment[] = [];
    let hasNextPage = true;
    let after = null;

    while (hasNextPage && allRelatedPosts.length < 20) {
      const relatedPostsData: PostsByTagQuery = await request(endpoint, PostsByTagDocument, {
        host,
        tagSlugs,
        first: 20,
        after
      });

      const newPosts = relatedPostsData.publication?.posts.edges
        .map((edge) => edge.node)
        .filter((post) => post.id !== currentPost.id) ?? [];
    
      allRelatedPosts = [...allRelatedPosts, ...newPosts];
      hasNextPage = relatedPostsData.publication?.posts.pageInfo?.hasNextPage ?? false;
      after = relatedPostsData.publication?.posts.pageInfo?.endCursor ?? null;    
    }

    const shuffledPosts = allRelatedPosts.sort(() => 0.5 - Math.random());
    const relatedPosts = shuffledPosts.slice(0, 3);

    return {
      props: {
        type: 'post',
        post: currentPost,
        publication: postData.publication,
        relatedPosts: relatedPosts || [],
      },
      revalidate: 1,
    };
  }

  // Statik sayfa için kontrol
  const pageData = await request(endpoint, PageByPublicationDocument, { host, slug });

  if (pageData.publication?.staticPage) {
    return {
      props: {
        type: 'page',
        page: pageData.publication.staticPage,
        publication: pageData.publication,
      },
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
      props: {
        type: 'category',
        series,
        posts,
        publication: seriesData.publication,
      },
      revalidate: 1,
    };
  }

  return {
    notFound: true,
    revalidate: 1,
  };
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