import mongoose, { ClientSession } from "mongoose";

import { Affiliate } from "~/models/Affiliate";
import { AffiliateStore } from "~/models/AffiliateStore";

interface ResolveAffiliateParams {
 affiliateCode?: string;
 storeId: string | mongoose.Types.ObjectId;
 session?: ClientSession;
}

export async function resolveAffiliate({ affiliateCode, storeId, session }: ResolveAffiliateParams) {
 const code = typeof affiliateCode === "string" ? affiliateCode.trim().toUpperCase() : "";

 if (!code) {
  return null;
 }

 if (!mongoose.Types.ObjectId.isValid(storeId)) {
  throw new Error("Invalid storeId.");
 }

 let affiliateQuery = Affiliate.findOne({
  code,
  status: "ACTIVE",
 });

 if (session) {
  affiliateQuery = affiliateQuery.session(session);
 }

 const affiliate = await affiliateQuery.lean();

 if (!affiliate) {
  throw new Error("Affiliate code is invalid or inactive.");
 }

 let affiliateStoreQuery = AffiliateStore.findOne({
  affiliateId: affiliate._id,
  storeId,
  status: "ACTIVE",
 });

 if (session) {
  affiliateStoreQuery = affiliateStoreQuery.session(session);
 }

 const affiliateStore = await affiliateStoreQuery.lean();

 if (!affiliateStore) {
  throw new Error("This affiliate is not active for this store.");
 }

 return {
  affiliateId: affiliate._id,
  affiliateStoreId: affiliateStore._id,
  affiliateCode: affiliate.code,
 };
}
