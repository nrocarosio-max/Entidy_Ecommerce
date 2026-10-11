import { useEffect, useRef } from "react";
import { useRouter } from "next/router";

export default function AffiliateTracker() {
 const router = useRouter();
 const lastTrackedRef = useRef("");

 useEffect(() => {
  console.log("AffiliateTracker running:", {
   isReady: router.isReady,
   ref: router.query.ref,
   pathname: router.pathname,
  });
  if (!router.isReady) return;

  const rawRef = router.query.ref;

  if (typeof rawRef !== "string" || !rawRef.trim()) {
   return;
  }

  const affiliateCode = rawRef.trim().toUpperCase();

  if (lastTrackedRef.current === affiliateCode) {
   return;
  }

  lastTrackedRef.current = affiliateCode;

  async function trackAffiliate() {
   try {
    const response = await fetch("/api/affiliate/track", {
     method: "POST",
     headers: {
      "Content-Type": "application/json",
     },
     body: JSON.stringify({
      ref: affiliateCode,
     }),
    });

    if (!response.ok) {
     lastTrackedRef.current = "";
     return;
    }

    const query = { ...router.query };
    delete query.ref;

    await router.replace(
     {
      pathname: router.pathname,
      query,
     },
     undefined,
     {
      shallow: true,
      scroll: false,
     },
    );
   } catch (error) {
    lastTrackedRef.current = "";
    console.error("Affiliate tracking failed:", error);
   }
  }

  trackAffiliate();
 }, [router.isReady, router.query.ref]);

 return null;
}
