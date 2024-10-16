import { request } from 'graphql-request';
import ErrorPage from 'next/error';
import Head from 'next/head';
import Link from 'next/link';
import { Navbar } from '../../components/navbar';
import CookieConsent from '../../components/CookieConsent';
import { Container } from '../../components/container';
import { AppProvider } from '../../components/contexts/appContext';
import { Footer } from '../../components/footer';
import { Header } from '../../components/header';
import { Layout } from '../../components/layout';
import { MarkdownToHtml } from '../../components/markdown-to-html';
import { PostHeader } from '../../components/post-header';
import type {
  DraftByIdQuery,
  DraftByIdQueryVariables,
  Post as PostType,
  Publication,
  PublicationByHostQuery,
  PublicationByHostQueryVariables,
} from '../../generated/graphql';
import { DraftByIdDocument, PublicationByHostDocument } from '../../generated/graphql';

type Props = {
  post: PostType;
  publication: Publication;
};

export default function Post({ publication, post }: Props) {
  if (!post) {
    return <ErrorPage statusCode={404} />;
  }
  const title = `${post.title} | Next.js Blog Example with Hashnode`;
  const highlightJsMonokaiTheme =
    '.hljs{display:block;overflow-x:auto;padding:.5em;background:#23241f}.hljs,.hljs-subst,.hljs-tag{color:#f8f8f2}.hljs,.hljs-emphasis,.hljs-strong{color:#a8a8a2}.hljs-bullet,.hljs-link,.hljs-literal,.hljs-number,.hljs-quote,.hljs-regexp{color:#ae81ff}.hljs-code,.hljs-section,.hljs-selector-class,.hljs-title{color:#a6e22e}.hljs-strong{font-weight:700}.hljs-emphasis{font-style:italic}.hljs-attr,.hljs-keyword,.hljs-name,.hljs-selector-tag{color:#f92672}.hljs-attribute,.hljs-symbol{color:#66d9ef}.hljs-class .hljs-title,.hljs-params{color:#f8f8f2}.hljs-addition,.hljs-built_in,.hljs-builtin-name,.hljs-selector-attr,.hljs-selector-id,.hljs-selector-pseudo,.hljs-string,.hljs-template-variable,.hljs-type,.hljs-variable{color:#e6db74}.hljs-comment,.hljs-deletion,.hljs-meta{color:#75715e}';



  return (
    <AppProvider publication={publication}>
      <Layout>
        <Header />
        <Navbar />
        <Container className="pt-101">
          <article className="border-b-1-1/2 flex flex-col items-start gap-10 pb-10">
            <Head>
              <title>{title}</title>
              <link rel="canonical" href={post.url} />
              <style dangerouslySetInnerHTML={{ __html: highlightJsMonokaiTheme }}></style>
            </Head>
            <PostHeader
							title={post.title}
							coverImage={post.coverImage?.url}
							date={new Date().toISOString()}
							author={post.author}
						/>
            <MarkdownToHtml contentMarkdown={post.content.markdown} />
          </article>
        </Container>
        <Footer />
        <CookieConsent />
      </Layout>
    </AppProvider>
  );
}

type Params = {
  params: {
    id: string;
  };
};

export async function getStaticProps({ params }: Params) {
  const [dataDraft, dataPublication] = await Promise.all([
    request<DraftByIdQuery, DraftByIdQueryVariables>(
      process.env.NEXT_PUBLIC_HASHNODE_GQL_ENDPOINT!,
      DraftByIdDocument,
      {
        id: params.id,
      }
    ),
    request<PublicationByHostQuery, PublicationByHostQueryVariables>(
      process.env.NEXT_PUBLIC_HASHNODE_GQL_ENDPOINT!,
      PublicationByHostDocument,
      {
        host: process.env.NEXT_PUBLIC_HASHNODE_PUBLICATION_HOST!,
      }
    ),
  ]);

  const publication = dataPublication.publication;
  const post = dataDraft.draft;

  return {
    props: {
      post,
      publication,
    },
    revalidate: 1,
  };
}

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: 'blocking',
  };
}
