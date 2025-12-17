import Head from "next/head";
import "../global.css";

import { Provider } from "react-redux";   // ⬅️ import Provider
import { store } from "../store/store";   // ⬅️ your store
import { Toaster } from "sonner";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="icon" href="/images/app-icon.png" />
        <title>DreamBook Publishing</title>
        <meta name="description" content="" />
      </Head>

      <Provider store={store}>   {/* ⬅️ wrap everything with Provider */}
        <main>
          <Toaster
            theme="light"
            position="bottom-right"
            offset="20px"
            richColors={true}
            toastOptions={{
              className: "job-seeker-toaster",
              duration: 5000,
            }}
          />
          <Component {...pageProps} />
        </main>
      </Provider>
    </>
  );
}
