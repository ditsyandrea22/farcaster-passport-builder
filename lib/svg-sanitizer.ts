// SVG Sanitizer - Fixes common SVG attribute issues
// Prevents errors from external wallet injection scripts

export class SVGSanitizer {
  private static instance: SVGSanitizer
  private sanitizationActive = false

  private constructor() {
    this.initializeSanitization()
  }

  static getInstance(): SVGSanitizer {
    if (!SVGSanitizer.instance) {
      SVGSanitizer.instance = new SVGSanitizer()
    }
    return SVGSanitizer.instance
  }

  private initializeSanitization(): void {
    if (typeof window === 'undefined') return

    try {
      // Set up MutationObserver to catch and fix SVG issues
      if (typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            // Check for added nodes with SVG issues
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                this.fixSVGErrors(node as Element)
              }
            })
          })
        })

        observer.observe(document.documentElement, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeOldValue: true
        })
      }

      // Fix existing SVG elements
      this.fixAllSVGElements()

      // Set up interval to periodically check for new SVG issues
      setInterval(() => {
        this.fixAllSVGElements()
      }, 5000)

      this.sanitizationActive = true
      console.log("🧹 SVG Sanitizer initialized")
    } catch (error) {
      console.error("Failed to initialize SVG sanitizer:", error)
    }
  }

  private fixSVGErrors(element: Element): void {
    if (element.tagName.toLowerCase() === 'svg') {
      this.fixSVGElement(element)
    }

    // Recursively fix child elements
    const children = element.children
    for (let i = 0; i < children.length; i++) {
      this.fixSVGErrors(children[i])
    }
  }

  private fixSVGElement(svgElement: Element): void {
    try {
      // Fix width attribute
      const width = svgElement.getAttribute('width')
      if (width === 'small' || width === 'large' || width === 'medium') {
        const numericWidth = this.getNumericSize(width)
        svgElement.setAttribute('width', numericWidth.toString())
        console.log(`🧹 Fixed SVG width: ${width} → ${numericWidth}`)
      }

      // Fix height attribute
      const height = svgElement.getAttribute('height')
      if (height === 'small' || height === 'large' || height === 'medium') {
        const numericHeight = this.getNumericSize(height)
        svgElement.setAttribute('height', numericHeight.toString())
        console.log(`🧹 Fixed SVG height: ${height} → ${numericHeight}`)
      }

      // Remove invalid SVG attributes
      const invalidAttrs = ['fill-rule', 'stroke-linejoin', 'stroke-linecap']
      invalidAttrs.forEach(attr => {
        if (svgElement.hasAttribute(attr)) {
          const value = svgElement.getAttribute(attr)
          if (value && !this.isValidSVGAttributeValue(attr, value)) {
            svgElement.removeAttribute(attr)
            console.log(`🧹 Removed invalid SVG attribute: ${attr}="${value}"`)
          }
        }
      })

    } catch (error) {
      console.warn("Error fixing SVG element:", error)
    }
  }

  private getNumericSize(size: string): number {
    const sizeMap: Record<string, number> = {
      'small': 16,
      'medium': 24,
      'large': 32
    }
    return sizeMap[size] || 24
  }

  private isValidSVGAttributeValue(attr: string, value: string): boolean {
    // Basic validation for common SVG attributes
    const validValues: Record<string, string[]> = {
      'fill-rule': ['nonzero', 'evenodd'],
      'stroke-linejoin': ['miter', 'round', 'bevel'],
      'stroke-linecap': ['butt', 'round', 'square']
    }

    const attrValidValues = validValues[attr]
    return !attrValidValues || attrValidValues.includes(value.toLowerCase())
  }

  private fixAllSVGElements(): void {
    try {
      const svgElements = document.querySelectorAll('svg')
      svgElements.forEach((svg) => {
        this.fixSVGElement(svg)
      })
    } catch (error) {
      console.warn("Error fixing all SVG elements:", error)
    }
  }

  public isActive(): boolean {
    return this.sanitizationActive
  }

  // Public method to manually fix SVG elements
  public sanitizeSVG(container: Element | Document = document): void {
    const svgElements = container.querySelectorAll ? 
      container.querySelectorAll('svg') : 
      (container as Document).querySelectorAll('svg')
    
    svgElements.forEach((svg) => {
      this.fixSVGErrors(svg)
    })
  }
}

// Export singleton instance
export const svgSanitizer = SVGSanitizer.getInstance()