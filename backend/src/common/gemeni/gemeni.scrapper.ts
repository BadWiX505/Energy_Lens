import google from 'googlethis';

/**
 * Searches Google Images and returns up to 5 direct image URLs.
 * @param description - A short description of the desired image.
 * @returns Up to 5 URLs, or null when nothing was found or an error occurred.
 */
export async function getImageUrl(description: string): Promise<string[] | null> {
  try {
    const images = await google.image(description, { safe: false });

    if (images.length === 0) {
      console.log(`[Scrapper] No images found for "${description}".`);
      return null;
    }

    const urls: string[] = images
      .slice(0, 5)
      .map((image: { url: string }) => image.url);

    console.log(`[Scrapper] Found ${urls.length} image(s) for "${description}":`, urls);
    return urls;

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Scrapper] Failed to scrape Google for "${description}":`, errorMessage);
    return null;
  }
}