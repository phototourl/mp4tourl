/** Stored in `user_resource.processed_url` when uploaded from Art Fight (not a CDN URL). */
export const ART_FIGHT_RESOURCE_MARKER = 'art-fight';

export function isArtFightResource(processedUrl?: string | null): boolean {
  return processedUrl === ART_FIGHT_RESOURCE_MARKER;
}

/** Resolve the public image URL; ignore non-URL marker values in processed_url. */
export function getResourcePublicUrl(resource: {
  originalUrl: string;
  processedUrl?: string | null;
}): string {
  if (isArtFightResource(resource.processedUrl)) {
    return resource.originalUrl;
  }
  if (resource.processedUrl?.startsWith('http')) {
    return resource.processedUrl;
  }
  return resource.originalUrl;
}
