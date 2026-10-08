export interface CityChainWatch {
 id: string;
 brand: string;
 collection: string;
 slug: string;
 strapType: string;
 name: string;
 description: string;
 features: { title: string }[];
 gender: "MEN" | "WOMEN" | "UNISEX";
 sourceUrl: string;
 price: number;
 priceNew: number;
 currency: string;
 status: "available" | "sold_out" | "coming_soon" | "discontinued";
 images: {
  main: string;
 };
}
