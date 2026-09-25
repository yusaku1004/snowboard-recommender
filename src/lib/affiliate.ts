import { RAKUTEN_AFF_ID, AMAZON_TAG, YAHOO_SID, YAHOO_PID } from "./constants";

// Affiliate search URL generators

function buildSearchQuery(brand: string, model: string): string {
  return `${brand} ${model} スノーボード`;
}

export function getRakutenSearchUrl(brand: string, model: string): string {
  const query = encodeURIComponent(buildSearchQuery(brand, model));
  const targetUrl = `https://search.rakuten.co.jp/search/mall/${query}/`;
  return `https://hb.afl.rakuten.co.jp/hgc/${RAKUTEN_AFF_ID}/?pc=${encodeURIComponent(targetUrl)}&m=${encodeURIComponent(targetUrl)}`;
}

export function getAmazonSearchUrl(brand: string, model: string): string {
  const query = encodeURIComponent(buildSearchQuery(brand, model));
  return `https://www.amazon.co.jp/s?k=${query}&tag=${AMAZON_TAG}`;
}

export function getYahooSearchUrl(brand: string, model: string): string {
  const query = encodeURIComponent(buildSearchQuery(brand, model));
  const targetUrl = `https://shopping.yahoo.co.jp/search?p=${query}`;
  return `https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=${YAHOO_SID}&pid=${YAHOO_PID}&vc_url=${encodeURIComponent(targetUrl)}`;
}
