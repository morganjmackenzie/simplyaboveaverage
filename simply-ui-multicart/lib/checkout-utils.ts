import type { CartItem } from "@/components/cart-provider"

// This function generates a checkout URL for a specific vendor with cart items
export function generateCheckoutUrl(vendor: string, items: CartItem[]): string {
  // Ensure we're only working with items from this specific vendor
  const vendorItems = items.filter((item) => item.vendor === vendor)

  if (vendorItems.length === 0) {
    console.error(`No items found for vendor: ${vendor}`)
    return `https://${vendor.toLowerCase().replace(/\s+/g, "")}.com`
  }

  // Get the base URL from the first product of this vendor
  const firstItem = vendorItems[0]
  let baseUrl = ""

  if (firstItem.product_url) {
    try {
      // Extract the domain from the product URL
      const url = new URL(firstItem.product_url)
      baseUrl = `${url.protocol}//${url.hostname}`

      // Log for debugging
      console.log(`Generated base URL for ${vendor}: ${baseUrl}`)
    } catch (error) {
      console.error(`Invalid product URL for ${vendor}:`, firstItem.product_url)
      // Fallback to a generic vendor URL
      baseUrl = `https://${vendor.toLowerCase().replace(/\s+/g, "")}.com`
    }
  } else {
    // Fallback to a generic vendor URL
    baseUrl = `https://${vendor.toLowerCase().replace(/\s+/g, "")}.com`
    console.log(`Using fallback URL for ${vendor}: ${baseUrl}`)
  }

  // Different vendors might have different URL structures for their checkout
  // Here we'll implement some common patterns that might work with popular e-commerce platforms

  // Shopify-style checkout URL
  if (baseUrl.includes("shopify") || baseUrl.includes("myshopify")) {
    return generateShopifyCheckoutUrl(baseUrl, vendorItems)
  }

  // WooCommerce-style checkout URL
  if (baseUrl.includes("woocommerce") || baseUrl.includes("wordpress")) {
    return generateWooCommerceCheckoutUrl(baseUrl, vendorItems)
  }

  // BigCommerce-style checkout URL
  if (baseUrl.includes("bigcommerce")) {
    return generateBigCommerceCheckoutUrl(baseUrl, vendorItems)
  }

  // For specific vendors, we can add custom URL generation
  if (vendor.toLowerCase().includes("american tall")) {
    return `https://americantall.com/cart`
  }

  if (vendor.toLowerCase().includes("universal standard")) {
    return `https://universalstandard.com/cart`
  }

  // Generic checkout URL (attempt to add items to cart via URL parameters)
  return generateGenericCheckoutUrl(baseUrl, vendorItems)
}

// Generate a Shopify-compatible checkout URL
function generateShopifyCheckoutUrl(baseUrl: string, items: CartItem[]): string {
  // Shopify uses /cart/{variant_id}:{quantity} format
  const cartItems = items
    .map((item) => {
      const variantId = item.variant_id || item.id
      return `${variantId}:${item.quantity}`
    })
    .join(",")

  return `${baseUrl}/cart/${cartItems}`
}

// Generate a WooCommerce-compatible checkout URL
function generateWooCommerceCheckoutUrl(baseUrl: string, items: CartItem[]): string {
  // WooCommerce uses ?add-to-cart={product_id}&quantity={quantity} format
  const params = new URLSearchParams()

  items.forEach((item, index) => {
    const productId = item.product_id || item.id
    params.append(`add-to-cart[${index}]`, productId)
    params.append(`quantity[${index}]`, item.quantity.toString())
  })

  return `${baseUrl}/checkout?${params.toString()}`
}

// Generate a BigCommerce-compatible checkout URL
function generateBigCommerceCheckoutUrl(baseUrl: string, items: CartItem[]): string {
  // BigCommerce uses /cart.php?action=add&product_id={product_id}&qty={quantity} format
  const params = new URLSearchParams()
  params.append("action", "add")

  items.forEach((item, index) => {
    const productId = item.product_id || item.id
    params.append(`product_id[${index}]`, productId)
    params.append(`qty[${index}]`, item.quantity.toString())
  })

  return `${baseUrl}/cart.php?${params.toString()}`
}

// Generate a generic checkout URL that might work with various e-commerce platforms
function generateGenericCheckoutUrl(baseUrl: string, items: CartItem[]): string {
  // Try a few common patterns
  const params = new URLSearchParams()

  // Add items in various formats that might be supported
  items.forEach((item) => {
    const productId = item.product_id || item.id
    const variantId = item.variant_id || ""

    // Format 1: product_id and quantity
    params.append("product_id", productId)
    params.append("quantity", item.quantity.toString())

    // Format 2: items array
    params.append(
      "items",
      JSON.stringify({
        id: productId,
        variant_id: variantId,
        quantity: item.quantity,
      }),
    )
  })

  // Try to target the cart or checkout page
  return `${baseUrl}/checkout?${params.toString()}`
}
