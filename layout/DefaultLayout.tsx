import React, { PropsWithChildren } from "react";
import Head from "next/head";

import Header from "~/components/common/Header";
import Footer from "~/components/common/Footer";
const DefaultLayout = ({ children }: PropsWithChildren) => {
 return (
  <>
   <Head>
    <link rel="icon" type="image/webp" href="/cc_icon_1a8b4b7a-ae75-4e9c-b6a9-56f959deff98_32x32.webp" />
    <title>City Chain | Online Watch Shop | Watch Retailer & Boutique</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"></meta>
    <meta property="og:title" content="Official Rolex Website - Swiss Luxury Watches" key="title" />
    <meta name="keywords" content="Official Rolex Website - Swiss Luxury Watches"></meta>
    <meta name="description" content="Official Rolex Website - Swiss Luxury Watches"></meta>
   </Head>
   <Header />
   <main className="w-full min-h-screen mt-[68px]">{children}</main>
   <Footer />
  </>
 );
};
export default DefaultLayout;
