import type { CartItem } from "@/components/cart-provider"

// Interface for platform-specific URL generators
interface PlatformHandler {
  detect: (url: string) => boolean
  generateUrl: (baseUrl: string, items: CartItem[]) => string
}

// Collection of platform handlers
const platformHandlers: PlatformHandler[] = [
  // Shopify
  {
    detect: (url) =>
      url.includes("shopify.com") ||
      url.includes("myshopify.com") ||
      url.includes("/cart") ||
      url.includes("/collections"),
    generateUrl: (baseUrl, items) => {
      // Shopify uses /cart/{variant_id}:{quantity} format
      const cartItems = items
        .map((item) => {
          // Use variant_id if available, otherwise use product_id
          const id = item.variant_id || item.product_id || item.id
          return `${id}:${item.quantity}`
        })
        .join(",")

      return `${baseUrl}/cart/${cartItems}`
    },
  },

  // WooCommerce
  {
    detect: (url) =>
      url.includes("wordpress") ||
      url.includes("woocommerce") ||
      url.includes("wp-content") ||
      url.includes("/product/"),
    generateUrl: (baseUrl, items) => {
      const params = new URLSearchParams()

      // WooCommerce supports multiple add-to-cart parameters
      items.forEach((item, index) => {
        const productId = item.product_id || item.id

        // Method 1: Standard add-to-cart
        if (index === 0) {
          params.append("add-to-cart", productId)
          params.append("quantity", item.quantity.toString())
        }
        // Method 2: Multiple items
        else {
          params.append(`add-to-cart[${index}]`, productId)
          params.append(`quantity[${index}]`, item.quantity.toString())
        }
      })

      return `${baseUrl}/cart/?${params.toString()}`
    },
  },

  // Magento
  {
    detect: (url) => url.includes("magento") || url.includes("/checkout/cart/add"),
    generateUrl: (baseUrl, items) => {
      // For simplicity, we'll just add the first item for Magento
      // as multiple items require complex form submissions
      if (items.length > 0) {
        const item = items[0]
        const params = new URLSearchParams()
        params.append("product", item.product_id || item.id)
        params.append("qty", item.quantity.toString())

        return `${baseUrl}/checkout/cart/add/?${params.toString()}`
      }
      return `${baseUrl}/checkout/cart/`
    },
  },

  // BigCommerce
  {
    detect: (url) => url.includes("bigcommerce") || url.includes("/cart.php"),
    generateUrl: (baseUrl, items) => {
      const params = new URLSearchParams()
      params.append("action", "add")

      items.forEach((item, index) => {
        const productId = item.product_id || item.id
        params.append(`product_id[${index}]`, productId)
        params.append(`qty[${index}]`, item.quantity.toString())
      })

      return `${baseUrl}/cart.php?${params.toString()}`
    },
  },

  // Squarespace
  {
    detect: (url) => url.includes("squarespace") || url.includes("squarespace.com"),
    generateUrl: (baseUrl, items) => {
      // Squarespace doesn't support direct cart URLs, redirect to the store page
      return `${baseUrl}/shop`
    },
  },

  // American Tall (confirmed working)
  {
    detect: (url) => url.includes("americantall.com") || url.toLowerCase().includes("american tall"),
    generateUrl: (baseUrl, items) => {
      // American Tall specific format (confirmed working)
      const params = new URLSearchParams()

      items.forEach((item) => {
        // Using variant_id as the key parameter for American Tall
        const variantId = item.variant_id || item.id
        params.append("id[]", variantId)
        params.append("quantity[]", item.quantity.toString())
      })

      return `https://americantall.com/cart/add?${params.toString()}`
    },
  },

  // Amalli Talli (new handler)
  {
    detect: (url) => url.includes("amallitalli.com") || url.toLowerCase().includes("amalli talli"),
    generateUrl: (baseUrl, items) => {
      // Amalli Talli uses Shopify, but with a specific format
      // First try the standard Shopify format
      const cartItems = items
        .map((item) => {
          const id = item.variant_id || item.product_id || item.id
          return `${id}:${item.quantity}`
        })
        .join(",")

      return `https://amallitalli.com/cart/${cartItems}`
    },
  },

  // Dolce Vita (new handler)
  {
    detect: (url) => url.includes("dolcevita.com") || url.toLowerCase().includes("dolce vita"),
    generateUrl: (baseUrl, items) => {
      // Based on research, Dolce Vita appears to use Shopify
      // Use the alternative Shopify cart format with 'add' endpoint
      const params = new URLSearchParams()
      items.forEach((item) => {
        const id = item.variant_id || item.product_id || item.id
        params.append("id", id)
        params.append("quantity", item.quantity.toString())
      })

      return `https://www.dolcevita.com/cart/add?${params.toString()}`
    },
  },

  // Elwood (new handler)
  {
    detect: (url) => url.includes("elwoodclothing.com") || url.toLowerCase().includes("elwood"),
    generateUrl: (baseUrl, items) => {
      // Based on research, Elwood appears to use Shopify
      // Use the alternative Shopify cart format with 'add' endpoint
      const params = new URLSearchParams()
      items.forEach((item) => {
        const id = item.variant_id || item.product_id || item.id
        params.append("id", id)
        params.append("quantity", item.quantity.toString())
      })

      return `https://www.elwoodclothing.com/cart/add?${params.toString()}`
    },
  },

  // Universal Standard
  {
    detect: (url) => url.includes("universalstandard.com") || url.toLowerCase().includes("universal standard"),
    generateUrl: (baseUrl, items) => {
      // Universal Standard specific format
      const itemsParam = items
        .map((item) => {
          const variantId = item.variant_id || item.id
          return `${variantId}:${item.quantity}`
        })
        .join(",")

      return `https://universalstandard.com/cart/${itemsParam}`
    },
  },
]

// Fallback generic handler
const genericHandler: PlatformHandler = {
  detect: () => true, // Always matches
  generateUrl: (baseUrl, items) => {
    // Try multiple common formats
    const params = new URLSearchParams()

    // Format 1: Simple add-to-cart
    if (items.length > 0) {
      const item = items[0]
      params.append("add-to-cart", item.product_id || item.id)
      params.append("quantity", item.quantity.toString())
    }

    // Format 2: JSON items array
    params.append(
      "items",
      JSON.stringify(
        items.map((item) => ({
          id: item.product_id || item.id,
          variant_id: item.variant_id,
          quantity: item.quantity,
        })),
      ),
    )

    return `${baseUrl}/cart?${params.toString()}`
  },
}

// Main function to generate cart URL
export function generateCartUrl(vendor: string, items: CartItem[]): string {
  if (!items.length) {
    return `https://${vendor.toLowerCase().replace(/\s+/g, "")}.com/cart`
  }

  // Extract base URL from the first product
  let baseUrl = ""
  try {
    if (items[0].product_url) {
      const url = new URL(items[0].product_url)
      baseUrl = `${url.protocol}//${url.hostname}`
    } else {
      baseUrl = `https://${vendor.toLowerCase().replace(/\s+/g, "")}.com`
    }
  } catch (error) {
    console.error("Error parsing URL:", error)
    baseUrl = `https://${vendor.toLowerCase().replace(/\s+/g, "")}.com`
  }

  // Find the appropriate handler for this URL
  const productUrl = items[0].product_url || baseUrl
  const vendorLower = vendor.toLowerCase()

  // Check for saved format preferences
  const savedFormats = getSavedVendorFormats()
  const savedFormat = savedFormats[vendorLower]

  if (savedFormat && savedFormat !== "default") {
    // If we have a saved format, use it
    const allUrls = generateAllCartUrls(vendor, items)
    if (allUrls[savedFormat]) {
      return allUrls[savedFormat]
    }
  }

  // For specific vendors, use our known working formats
  if (vendorLower.includes("american tall")) {
    return platformHandlers.find((h) => h.detect("americantall.com"))?.generateUrl(baseUrl, items) || defaultUrl(vendor)
  }

  if (vendorLower.includes("amalli talli")) {
    return platformHandlers.find((h) => h.detect("amallitalli.com"))?.generateUrl(baseUrl, items) || defaultUrl(vendor)
  }

  if (vendorLower.includes("dolce vita")) {
    return platformHandlers.find((h) => h.detect("dolcevita.com"))?.generateUrl(baseUrl, items) || defaultUrl(vendor)
  }

  if (vendorLower.includes("elwood")) {
    return (
      platformHandlers.find((h) => h.detect("elwoodclothing.com"))?.generateUrl(baseUrl, items) || defaultUrl(vendor)
    )
  }

  // For other vendors, use the standard detection and URL generation
  const handler = platformHandlers.find((h) => h.detect(productUrl)) || genericHandler

  // Generate the cart URL
  return handler.generateUrl(baseUrl, items)
}

// Helper function for default URL
function defaultUrl(vendor: string): string {
  return `https://${vendor.toLowerCase().replace(/\s+/g, "")}.com/cart`
}

// Load saved vendor formats from localStorage
function getSavedVendorFormats(): Record<string, string> {
  if (typeof window === "undefined") return {}

  try {
    const saved = localStorage.getItem("vendorFormats")
    return saved ? JSON.parse(saved) : {}
  } catch (error) {
    console.error("Error loading saved vendor formats:", error)
    return {}
  }
}

// Function to generate multiple cart URL formats for testing
export function generateAllCartUrls(vendor: string, items: CartItem[]): Record<string, string> {
  if (!items.length) {
    return { generic: `https://${vendor.toLowerCase().replace(/\s+/g, "")}.com/cart` }
  }

  // Extract base URL from the first product
  let baseUrl = ""
  try {
    if (items[0].product_url) {
      const url = new URL(items[0].product_url)
      baseUrl = `${url.protocol}//${url.hostname}`
    } else {
      baseUrl = `https://${vendor.toLowerCase().replace(/\s+/g, "")}.com`
    }
  } catch (error) {
    console.error("Error parsing URL:", error)
    baseUrl = `https://${vendor.toLowerCase().replace(/\s+/g, "")}.com`
  }

  // Generate URLs for all handlers
  const urls: Record<string, string> = {}
  const vendorLower = vendor.toLowerCase()

  // Special handling for Amalli Talli
  if (vendorLower.includes("amalli talli")) {
    // Standard Shopify cart format
    const cartItems = items
      .map((item) => {
        const id = item.variant_id || item.product_id || item.id
        return `${id}:${item.quantity}`
      })
      .join(",")
    urls.standard = `https://amallitalli.com/cart/${cartItems}`

    // Alternative Shopify cart format with 'add' endpoint
    const params = new URLSearchParams()
    items.forEach((item) => {
      const id = item.variant_id || item.product_id || item.id
      params.append("id", id)
      params.append("quantity", item.quantity.toString())
    })
    urls.alternative = `https://amallitalli.com/cart/add?${params.toString()}`

    // Another alternative format
    const params2 = new URLSearchParams()
    items.forEach((item) => {
      const id = item.variant_id || item.product_id || item.id
      params2.append("id[]", id)
      params2.append("quantity[]", item.quantity.toString())
    })
    urls.alternative2 = `https://amallitalli.com/cart/add?${params2.toString()}`

    urls.generic = genericHandler.generateUrl(baseUrl, items)
    return urls
  }

  // Special handling for Dolce Vita
  if (vendorLower.includes("dolce vita")) {
    // Standard Shopify cart format
    const cartItems = items
      .map((item) => {
        const id = item.variant_id || item.product_id || item.id
        return `${id}:${item.quantity}`
      })
      .join(",")
    urls.standard = `https://www.dolcevita.com/cart/${cartItems}`

    // Alternative Shopify cart format with 'add' endpoint
    const params = new URLSearchParams()
    items.forEach((item) => {
      const id = item.variant_id || item.product_id || item.id
      params.append("id", id)
      params.append("quantity", item.quantity.toString())
    })
    urls.alternative = `https://www.dolcevita.com/cart/add?${params.toString()}`

    urls.generic = genericHandler.generateUrl(baseUrl, items)
    return urls
  }

  // Special handling for Elwood
  if (vendorLower.includes("elwood")) {
    // Standard Shopify cart format
    const cartItems = items
      .map((item) => {
        const id = item.variant_id || item.product_id || item.id
        return `${id}:${item.quantity}`
      })
      .join(",")
    urls.standard = `https://www.elwoodclothing.com/cart/${cartItems}`

    // Alternative Shopify cart format with 'add' endpoint
    const params = new URLSearchParams()
    items.forEach((item) => {
      const id = item.variant_id || item.product_id || item.id
      params.append("id", id)
      params.append("quantity", item.quantity.toString())
    })
    urls.alternative = `https://www.elwoodclothing.com/cart/add?${params.toString()}`

    urls.generic = genericHandler.generateUrl(baseUrl, items)
    return urls
  }

  // For other vendors, generate URLs for all handlers
  platformHandlers.forEach((handler, index) => {
    if (handler.detect(baseUrl) || handler.detect(vendor)) {
      urls[`format_${index + 1}`] = handler.generateUrl(baseUrl, items)
    }
  })

  urls.generic = genericHandler.generateUrl(baseUrl, items)

  return urls
}
