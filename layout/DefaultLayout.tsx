import React, { PropsWithChildren } from "react";
import Head from "next/head";

import Header from "~/components/common/Header";
import Footer from "~/components/common/Footer";
const DefaultLayout = ({ children }: PropsWithChildren) => {
 return (
  <>
   <Head>
    <link rel="icon" type="image/webp" href="/6a15d744-9c7e-4edb-8c96-2d61d19696c9.webp" />
    <title>MELORA | Làm đẹp – Chăm sóc – Phong cách sống</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"></meta>
    <meta property="og:title" content="Làm đẹp – Chăm sóc – Phong cách sống" key="title" />
    <meta name="keywords" content="Làm đẹp – Chăm sóc – Phong cách sống"></meta>
    <meta name="description" content="Làm đẹp – Chăm sóc – Phong cách sống"></meta>
   </Head>
   <Header />
   <main className="w-full min-h-screen mt-[68px]">{children}</main>
   <Footer />
  </>
 );
};
export default DefaultLayout;
