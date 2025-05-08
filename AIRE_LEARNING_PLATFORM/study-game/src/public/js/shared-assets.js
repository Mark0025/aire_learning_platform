/**
 * Shared Assets - Contains assets that can be reused across the application
 */

// AIRE Logo path
const aireLogoPath = '/images/aire-logo.png.jpg';

// Function to insert the logo into an element
function insertAireLogo(elementId, width = 200, height = 60) {
  const element = document.getElementById(elementId);
  if (element) {
    // Create an image element
    const img = document.createElement('img');
    img.src = aireLogoPath;
    img.alt = 'AIRE Logo';
    img.className = 'logo-img';
    
    // Set width and height if provided
    if (width) img.style.width = `${width}px`;
    if (height) img.style.height = 'auto';
    
    // Clear and append
    element.innerHTML = '';
    element.appendChild(img);
  }
}

// Base64 encoded version is no longer used since we're using a JPG file
// This is kept as a placeholder for backward compatibility
const aireLogoBase64 = aireLogoPath;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    aireLogoPath,
    aireLogoBase64,
    insertAireLogo
  };
} 