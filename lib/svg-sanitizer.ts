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

      // Also fix SVGs that might be in shadow DOM or iframes
      this.fixShadowDOMSVGs()

      // Set up interval to periodically check for new SVG issues
      setInterval(() => {
        this.fixAllSVGElements()
        this.fixShadowDOMSVGs()
      }, 3000) // More frequent checks

      this.sanitizationActive = true
      console.log("🧹 SVG Sanitizer initialized")
    } catch (error) {
      console.error("Failed to initialize SVG sanitizer:", error)
    }
  }

  private fixSVGErrors(element: Element): void {
    if (element.tagName && element.tagName.toLowerCase() === 'svg') {
      this.fixSVGElement(element)
    }

    // Recursively fix child elements, including SVG elements that might be nested
    const children = element.children
    for (let i = 0; i < children.length; i++) {
      this.fixSVGErrors(children[i])
    }
    
    // Also check for SVG elements that might be added as text content (inlined SVGs)
    if (element.innerHTML && element.innerHTML.includes('<svg')) {
      this.fixInlineSVGs(element)
    }
  }
  
  private fixInlineSVGs(container: Element): void {
    try {
      // Use a temporary container to parse and fix inline SVGs
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = container.innerHTML
      
      const inlineSVGs = tempDiv.querySelectorAll('svg')
      inlineSVGs.forEach(svg => {
        this.fixSVGElement(svg)
      })
      
      // Update the container with fixed SVG content
      container.innerHTML = tempDiv.innerHTML
    } catch (error) {
      // Silently handle parsing errors
    }
  }

  private fixSVGElement(svgElement: Element): void {
    try {
      // Fix width attribute - be more aggressive
      const width = svgElement.getAttribute('width')
      if (width && (width === 'small' || width === 'large' || width === 'medium' || isNaN(Number(width)))) {
        const numericWidth = isNaN(Number(width)) ? 24 : this.getNumericSize(width)
        svgElement.setAttribute('width', numericWidth.toString())
        console.log(`🧹 Fixed SVG width: ${width} → ${numericWidth}`)
      }

      // Fix height attribute - be more aggressive
      const height = svgElement.getAttribute('height')
      if (height && (height === 'small' || height === 'large' || height === 'medium' || isNaN(Number(height)))) {
        const numericHeight = isNaN(Number(height)) ? 24 : this.getNumericSize(height)
        svgElement.setAttribute('height', numericHeight.toString())
        console.log(`🧹 Fixed SVG height: ${height} → ${numericHeight}`)
      }

      // Fix any non-numeric width/height attributes
      ['width', 'height'].forEach(attr => {
        const value = svgElement.getAttribute(attr)
        if (value && isNaN(Number(value))) {
          const numericValue = this.getNumericSize(value) || 24
          svgElement.setAttribute(attr, numericValue.toString())
          console.log(`🧹 Fixed SVG ${attr}: ${value} → ${numericValue}`)
        }
      })

      // Remove invalid SVG attributes that commonly cause issues
      const invalidAttrs = ['fill-rule', 'stroke-linejoin', 'stroke-linecap', 'xmlns:xlink']
      invalidAttrs.forEach(attr => {
        if (svgElement.hasAttribute(attr)) {
          const value = svgElement.getAttribute(attr)
          if (value && !this.isValidSVGAttributeValue(attr, value)) {
            svgElement.removeAttribute(attr)
            console.log(`🧹 Removed invalid SVG attribute: ${attr}="${value}"`)
          }
        }
      })

      // Ensure SVG has proper namespace
      if (!svgElement.getAttribute('xmlns')) {
        svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
      }

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

  private fixShadowDOMSVGs(): void {
    try {
      // Fix SVGs in shadow DOM if available
      const allElements = document.querySelectorAll('*')
      allElements.forEach(element => {
        if (element.shadowRoot) {
          const shadowSVGs = element.shadowRoot.querySelectorAll('svg')
          shadowSVGs.forEach(svg => {
            this.fixSVGElement(svg)
          })
        }
      })
    } catch (error) {
      // Silently handle shadow DOM errors
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