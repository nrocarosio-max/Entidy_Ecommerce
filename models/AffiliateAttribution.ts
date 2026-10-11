import mongoose, { Schema, models } from "mongoose";

const AffiliateAttributionEntrySchema = new Schema(
 {
  affiliateId: {
   type: Schema.Types.ObjectId,
   ref: "Affiliate",
   required: true,
  },

  affiliateStoreId: {
   type: Schema.Types.ObjectId,
   ref: "AffiliateStore",
   required: true,
  },

  storeId: {
   type: Schema.Types.ObjectId,
   ref: "Store",
   required: true,
  },

  affiliateCode: {
   type: String,
   required: true,
   uppercase: true,
   trim: true,
  },

  clickedAt: {
   type: Date,
   required: true,
  },

  expiresAt: {
   type: Date,
   required: true,
  },
 },
 {
  _id: false,
 },
);

const AffiliateAttributionSchema = new Schema(
 {
  tokenHash: {
   type: String,
   required: true,
   unique: true,
   index: true,
  },

  // Affiliate code awaiting store identification.
  pendingAffiliateCode: {
   type: String,
   uppercase: true,
   trim: true,
   default: null,
  },

  pendingClickedAt: {
   type: Date,
   default: null,
  },

  pendingExpiresAt: {
   type: Date,
   default: null,
  },

  // Resolved attribution records, one per store.
  attributions: {
   type: [AffiliateAttributionEntrySchema],
   default: [],
  },

  // MongoDB TTL cleanup for the whole document.
  expiresAt: {
   type: Date,
   required: true,
   index: {
    expireAfterSeconds: 0,
   },
  },
 },
 {
  timestamps: true,
 },
);

export const AffiliateAttribution = models.AffiliateAttribution || mongoose.model("AffiliateAttribution", AffiliateAttributionSchema);
