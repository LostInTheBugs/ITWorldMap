import countries from "i18n-iso-countries";
import fr from "i18n-iso-countries/langs/fr.json";
import en from "i18n-iso-countries/langs/en.json";

countries.registerLocale(fr);
countries.registerLocale(en);

export interface CountryEntry {
  iso3: string;
  name: string;        // nom ADMIN du GeoJSON (anglais)
  nameFr?: string;     // nom français (i18n-iso-countries)
  nameEn?: string;
  lat: number;
  lng: number;
}

/** Nom localisé, avec repli sur le nom ADMIN du GeoJSON. */
export function countryName(iso3: string, name: string, lang: "fr" | "en"): string {
  const localized = lang === "fr" ? countries.getName(iso3, "fr") : countries.getName(iso3, "en");
  return localized || name;
}

/** Emoji drapeau à partir de l'ISO3 (vide si code inconnu). */
export function flagEmoji(iso3: string): string {
  const a2 = countries.alpha3ToAlpha2(iso3);
  if (!a2) return "";
  const base = 0x1f1e6;
  return String.fromCodePoint(base + (a2.charCodeAt(0) - 65), base + (a2.charCodeAt(1) - 65));
}
