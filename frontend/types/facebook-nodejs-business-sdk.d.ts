declare module 'facebook-nodejs-business-sdk' {
  export class FacebookAdsApi {
    static init(accessToken: string): FacebookAdsApi;
  }

  export class User {
    constructor(api: FacebookAdsApi);
    getAdAccounts(fields: string[]): Promise<Array<{
      id: string;
      name: string;
      account_status: number;
    }>>;
  }
} 