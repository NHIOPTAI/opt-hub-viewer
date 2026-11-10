const ALL = Object.freeze(['de', 'en', 'ro', 'fr', 'es', 'it', 'pl', 'nl']);
const STABLE = Object.freeze(['de', 'en']);

export function languagesForModuleUrl(address) {
  const url = new URL(address);
  const localPreview = url.protocol === 'file:' || ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  return localPreview ? ALL : STABLE;
}

// Remote publication offers stable languages. The existing loopback preview
// and file-based unit harness retain every authored draft language.
export const UI_RELEASE_LANGUAGES = languagesForModuleUrl(import.meta.url);
