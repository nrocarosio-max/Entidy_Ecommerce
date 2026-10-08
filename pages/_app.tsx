import "~/styles/globals.css";

import { SessionProvider } from "next-auth/react";
import { Provider } from "react-redux";
import { useRouter } from "next/router";

import { store } from "~/Redux/store";
import { MyAppProps } from "~/layout/types";
import { Layouts } from "~/layout/Layouts";
function App({ Component, pageProps }: MyAppProps) {
 const router = useRouter();

 const Layout = Layouts[Component.Layout] ?? ((page: any) => page);

 const isAdmin = router.pathname.startsWith("/admin");

 return (
  <SessionProvider session={pageProps.session}>
   <Provider store={store}>
    {isAdmin ? (
     <Layout>
      <Component {...pageProps} />
     </Layout>
    ) : (
     <Layout>
      <Component {...pageProps} />
     </Layout>
    )}
   </Provider>
  </SessionProvider>
 );
}

export default App;
