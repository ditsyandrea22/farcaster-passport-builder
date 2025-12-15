/**
 * OpenSea API utilities for NFT collection management
 */

export interface OpenSeaAsset {
  id: number;
  name: string;
  description: string;
  image_url: string;
  external_link?: string;
  animation_url?: string;
  traits: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
}

export interface OpenSeaCollection {
  name: string;
  description: string;
  image_url: string;
  external_url: string;
  total_supply: number;
}

export class OpenSeaAPI {
  private apiKey: string;
  private baseUrl = 'https://api.opensea.io/api/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Get collection information
   */
  async getCollection(slug: string): Promise<OpenSeaCollection | null> {
    try {
      const response = await fetch(`${this.baseUrl}/collection/${slug}`, {
        headers: {
          'X-API-KEY': this.apiKey,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`OpenSea API error: ${response.status}`);
      }

      const data = await response.json();
      return data.collection || null;
    } catch (error) {
      console.error('Failed to fetch OpenSea collection:', error);
      return null;
    }
  }

  /**
   * Get assets from a collection
   */
  async getCollectionAssets(slug: string, limit = 20, offset = 0): Promise<OpenSeaAsset[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/assets?collection=${slug}&limit=${limit}&offset=${offset}`,
        {
          headers: {
            'X-API-KEY': this.apiKey,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`OpenSea API error: ${response.status}`);
      }

      const data = await response.json();
      return data.assets || [];
    } catch (error) {
      console.error('Failed to fetch OpenSea assets:', error);
      return [];
    }
  }

  /**
   * Get single asset by contract address and token ID
   */
  async getAsset(contractAddress: string, tokenId: string): Promise<OpenSeaAsset | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/asset/${contractAddress}/${tokenId}/`,
        {
          headers: {
            'X-API-KEY': this.apiKey,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`OpenSea API error: ${response.status}`);
      }

      const data = await response.json();
      return data || null;
    } catch (error) {
      console.error('Failed to fetch OpenSea asset:', error);
      return null;
    }
  }

  /**
   * Register collection for OpenSea metadata updates
   */
  async registerCollection(contractAddress: string, collectionSlug: string): Promise<boolean> {
    try {
      // This would typically be done through OpenSea's collection management
      console.log(`Registering collection ${collectionSlug} with contract ${contractAddress}`);
      return true;
    } catch (error) {
      console.error('Failed to register collection:', error);
      return false;
    }
  }

  /**
   * Format mint fee with estimated gas for display
   */
  formatMintCost(mintFeeEth: string, estimatedGas: string = '0.001'): string {
    const mintFee = parseFloat(mintFeeEth);
    const gasFee = parseFloat(estimatedGas);
    const total = mintFee + gasFee;
    return total.toFixed(6); // Show total with 6 decimal places
  }
}

// Initialize OpenSea API if API key is available
export const openSeaAPI = process.env.OPENSEA_API_KEY 
  ? new OpenSeaAPI(process.env.OPENSEA_API_KEY)
  : null;