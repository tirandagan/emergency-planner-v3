import * as PAAPI from 'paapi5-nodejs-sdk';

// Interfaces for the response we want (aligned with ScrapedProduct)
interface PAAPIItem {
  asin: string;
  title: string;
  image?: string;
  price?: number;
  currency?: string;
  description?: string;
  url?: string;
}

interface PAAPIError {
    code: string;
    message: string;
}

const KEY = process.env.AMAZON_ACCESS_KEY;
const SECRET = process.env.AMAZON_SECRET_KEY;
const TAG = process.env.AMAZON_PARTNER_TAG;
const REGION = process.env.AMAZON_REGION || 'us-east-1';
const HOST = `webservices.amazon.${process.env.AMAZON_TLD || 'com'}`;

export const getAmazonItem = async (asin: string): Promise<{ item?: PAAPIItem; error?: string }> => {
  if (!KEY || !SECRET || !TAG) {
    console.error('Amazon PAAPI credentials missing');
    return { error: 'Amazon PAAPI credentials missing. Check .env.local' };
  }

  const client = PAAPI.ApiClient.instance;
  client.accessKey = KEY;
  client.secretKey = SECRET;
  client.host = HOST;
  client.region = REGION;

  const api = new PAAPI.DefaultApi();
  const getItemsRequest = new PAAPI.GetItemsRequest();

  getItemsRequest['PartnerTag'] = TAG;
  getItemsRequest['PartnerType'] = 'Associates';
  getItemsRequest['ItemIds'] = [asin];
  getItemsRequest['Condition'] = 'Any';
  getItemsRequest['Resources'] = [
    'Images.Primary.Large',
    'ItemInfo.Title',
    'ItemInfo.Features',
    'ItemInfo.ProductInfo',
    'OffersV2.Listings.Price',
    'OffersV2.Listings.Availability'
  ];

  try {
    const data = await api.getItems(getItemsRequest);
    const response = PAAPI.GetItemsResponse.constructFromObject(data);

    if (response['ItemsResult'] && response['ItemsResult']['Items'] && response['ItemsResult']['Items'].length > 0) {
      const item = response['ItemsResult']['Items'][0];
      
      let price = 0;
      let currency = 'USD';
      
      // Try to find price
      if (item.OffersV2 && item.OffersV2.Listings && item.OffersV2.Listings.length > 0) {
        const listing = item.OffersV2.Listings[0];
        if (listing.Price && listing.Price.Money) {
            price = parseFloat(listing.Price.Money.Amount || '0');
            currency = listing.Price.Money.Currency || 'USD';
        }
      }

      // Description from features
      let description = '';
      if (item.ItemInfo && item.ItemInfo.Features && item.ItemInfo.Features.DisplayValues) {
        description = item.ItemInfo.Features.DisplayValues.join('\n');
      }

      return {
        item: {
          asin: item.ASIN,
          title: item.ItemInfo?.Title?.DisplayValue || '',
          image: item.Images?.Primary?.Large?.URL || '',
          price,
          currency,
          description,
          url: item.DetailPageURL
        }
      };
    }
    
    if (response['Errors']) {
        const errors = response['Errors'] as PAAPIError[];
        console.error('PAAPI Errors:', JSON.stringify(errors));
        return { error: `Amazon API Error: ${errors.map(e => e.message).join(', ')}` };
    }
    
    return { error: 'Item not found or empty response from Amazon' };

  } catch (error: any) {
    console.error('Error calling Amazon PAAPI:', error);
    return { error: `Network/SDK Error: ${error.message || JSON.stringify(error)}` };
  }
};

export const searchAmazonItems = async (query: string): Promise<{ items: PAAPIItem[], error?: string }> => {
    if (!KEY || !SECRET || !TAG) {
        console.error('Amazon PAAPI credentials missing');
        return { items: [], error: 'Amazon PAAPI credentials missing' };
    }

    const client = PAAPI.ApiClient.instance;
    client.accessKey = KEY;
    client.secretKey = SECRET;
    client.host = HOST;
    client.region = REGION;

    const api = new PAAPI.DefaultApi();
    const searchItemsRequest = new PAAPI.SearchItemsRequest();

    searchItemsRequest['PartnerTag'] = TAG;
    searchItemsRequest['PartnerType'] = 'Associates';
    searchItemsRequest['Keywords'] = query;
    searchItemsRequest['ItemCount'] = 10;
    searchItemsRequest['Resources'] = [
        'Images.Primary.Medium',
        'ItemInfo.Title',
        'OffersV2.Listings.Price'
    ];

    try {
        const data = await api.searchItems(searchItemsRequest);
        const response = PAAPI.SearchItemsResponse.constructFromObject(data);

        if (response['SearchResult'] && response['SearchResult']['Items']) {
            const items = response['SearchResult']['Items'].map((item: any) => {
                 let price = 0;
                 let currency = 'USD';
                 if (item.OffersV2 && item.OffersV2.Listings && item.OffersV2.Listings.length > 0) {
                    const listing = item.OffersV2.Listings[0];
                    if (listing.Price && listing.Price.Money) {
                        price = parseFloat(listing.Price.Money.Amount || '0');
                        currency = listing.Price.Money.Currency || 'USD';
                    }
                 }

                 return {
                    asin: item.ASIN,
                    title: item.ItemInfo?.Title?.DisplayValue || '',
                    image: item.Images?.Primary?.Medium?.URL || '',
                    price,
                    currency,
                    url: item.DetailPageURL
                 };
            });
            return { items };
        }
        
        if (response['Errors']) {
             const errors = response['Errors'] as PAAPIError[];
             console.error('PAAPI Search Errors:', JSON.stringify(errors));
             return { items: [], error: `Amazon API Error: ${errors.map(e => e.message).join(', ')}` };
        }

        return { items: [] };
    } catch (error: any) {
        console.error('Error searching Amazon PAAPI:', error);
        return { items: [], error: `Network/SDK Error: ${error.message || JSON.stringify(error)}` };
    }
};
