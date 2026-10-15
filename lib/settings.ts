import "server-only";
import { cache } from "react";
import { createPocketBase } from "./pocketbase";
import {
  defaultSettings,
  SETTINGS_ID,
  type SiteSettings,
} from "./settings-values";
export { defaultSettings, SETTINGS_ID, safeWebUrl } from "./settings-values";
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    return {
      ...defaultSettings,
      ...(await createPocketBase()
        .collection("site_settings")
        .getOne<SiteSettings>(SETTINGS_ID)),
    };
  } catch {
    return defaultSettings;
  }
});
