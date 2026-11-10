const ALL = Object.freeze(['de', 'en', 'ro', 'fr', 'es', 'it', 'pl', 'nl']);

export function languagesForModuleUrl(address) {
  new URL(address); // Preserve invalid-module-URL rejection.
  return ALL;
}

// Owner decision V1.5 permits all eight UI languages as provisional versions.
// Original documents and the existing Access bootstrap retain their own contracts.
export const UI_RELEASE_LANGUAGES = languagesForModuleUrl(import.meta.url);
