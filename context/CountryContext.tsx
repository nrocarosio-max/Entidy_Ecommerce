"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import type { CityChainWatch } from "~/data/CityChainWatch";
import { watchesSG } from "~/data/watchesSG";
import { watchesMY } from "~/data/watchesMY";

export type Country = "SG" | "MY";

interface CountryContextType {
 country: Country;
 watches: CityChainWatch[];
 loading: boolean;

 showCountryPopup: boolean;

 selectCountry: (country: Country) => void;
}

const CountryContext = createContext<CountryContextType | undefined>(undefined);

interface CountryProviderProps {
 children: ReactNode;
}

export function CountryProvider({ children }: CountryProviderProps) {
 const [country, setCountry] = useState<Country>("SG");
 const [loading, setLoading] = useState(true);
 const [showCountryPopup, setShowCountryPopup] = useState(false);

 useEffect(() => {
  const detectCountry = async () => {
   try {
    /*
     * Detect country from visitor IP
     */
    const response = await fetch("https://ipapi.co/json/", {
     cache: "no-store",
    });

    if (!response.ok) {
     throw new Error("Failed to detect country");
    }

    const data = await response.json();

    const ipCountry = data?.country_code?.toUpperCase();

    /*
     * SG -> Singapore
     * Everything else -> Malaysia
     */
    const detectedCountry: Country = ipCountry === "SG" ? "SG" : "MY";

    setCountry(detectedCountry);

    localStorage.setItem("selected_country", detectedCountry);

    setShowCountryPopup(false);
   } catch (error) {
    console.error("Country detection failed:", error);

    /*
     * Fallback -> Malaysia
     */
    setCountry("MY");

    localStorage.setItem("selected_country", "MY");

    setShowCountryPopup(false);
   } finally {
    setLoading(false);
   }
  };

  detectCountry();
 }, []);

 /*
  * Customer manually changes country
  */
 const selectCountry = (selectedCountry: Country) => {
  setCountry(selectedCountry);

  localStorage.setItem("selected_country", selectedCountry);

  setShowCountryPopup(false);
 };

 /*
  * Product data changes according to country
  */
 const watches = country === "MY" ? watchesMY : watchesSG;

 return (
  <CountryContext.Provider
   value={{
    country,
    watches,
    loading,
    showCountryPopup,
    selectCountry,
   }}>
   {children}
  </CountryContext.Provider>
 );
}

export function useCountry() {
 const context = useContext(CountryContext);

 if (!context) {
  throw new Error("useCountry must be used inside CountryProvider");
 }

 return context;
}
