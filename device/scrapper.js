import  google from 'googlethis';

/**
 * Searches Google Images and returns the direct image URL.
 * @param {string} description - The name or description of the image.
 * @returns {Promise<string | null>}
 */
async function getImageUrl(description) {
  try {
    // Perform the image search
    const images = await google.image(description, { safe: false });

    if (images.length >= 3) {
      const threeFisrtImages = images.slice(0, 3).map(image => image.url);
      console.log(`Found 3 images for "${description}":`, threeFisrtImages);
      return threeFisrtImages;
    } else if (images.length > 0) {
      const firstImageUrl = images[0].url;
      console.log(`Found image for "${description}":`, firstImageUrl);
      return firstImageUrl;
    }

    console.log(`No images found for "${description}".`);
    return null;

  } catch (error) {
    console.error(`Failed to scrape Google for "${description}":`, error.message);
    return null;
  }
}

getImageUrl('energy saving');