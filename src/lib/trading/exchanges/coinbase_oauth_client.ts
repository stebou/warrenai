import axios, { AxiosResponse } from 'axios';

export interface CoinbaseOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  sandbox: boolean;
}

export interface CoinbaseTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface CoinbaseAccount {
  id: string;
  name: string;
  primary: boolean;
  type: string;
  currency: {
    code: string;
    name: string;
    color: string;
    sort_index: number;
    exponent: number;
    type: string;
    address_regex: string;
    asset_id: string;
  };
  balance: {
    amount: string;
    currency: string;
  };
  created_at: string;
  updated_at: string;
  resource: string;
  resource_path: string;
}

export interface CoinbaseUser {
  id: string;
  name: string;
  username: string;
  profile_location: string | null;
  profile_bio: string | null;
  profile_url: string;
  avatar_url: string;
  resource: string;
  resource_path: string;
}

export class CoinbaseOAuthClient {
  private config: CoinbaseOAuthConfig;
  private baseUrl: string;
  private authBaseUrl: string;

  constructor(config: CoinbaseOAuthConfig) {
    this.config = config;
    this.baseUrl = config.sandbox 
      ? process.env.COINBASE_SANDBOX_BASE_URL || 'https://api-sandbox.coinbase.com'
      : process.env.COINBASE_PRODUCTION_BASE_URL || 'https://api.coinbase.com';
    this.authBaseUrl = process.env.COINBASE_AUTH_BASE_URL || 'https://login.coinbase.com';
  }

  /**
   * Étape 1: Générer l'URL d'autorisation OAuth2
   */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      state,
      scope: 'wallet:user:read,wallet:accounts:read,wallet:transactions:read'
    });

    return `${this.authBaseUrl}/oauth2/auth?${params.toString()}`;
  }

  /**
   * Étape 2: Échanger le code d'autorisation contre des tokens
   */
  async exchangeCodeForTokens(code: string): Promise<CoinbaseTokens> {
    try {
      const response: AxiosResponse<CoinbaseTokens> = await axios.post(
        `${this.authBaseUrl}/oauth2/token`,
        {
          grant_type: 'authorization_code',
          code,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          redirect_uri: this.config.redirectUri
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'WarrenAI-TradingBot/1.0'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }

  /**
   * Étape 3: Rafraîchir les tokens expirés
   */
  async refreshTokens(refreshToken: string): Promise<CoinbaseTokens> {
    try {
      const response: AxiosResponse<CoinbaseTokens> = await axios.post(
        `${this.authBaseUrl}/oauth2/token`,
        {
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'WarrenAI-TradingBot/1.0'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error refreshing tokens:', error);
      throw new Error('Failed to refresh tokens');
    }
  }

  /**
   * Faire des appels API authentifiés
   */
  async makeAuthenticatedRequest(
    accessToken: string, 
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', 
    data?: any
  ): Promise<AxiosResponse> {
    try {
      return await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        data,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'CB-VERSION': '2024-01-01',
          'User-Agent': 'WarrenAI-TradingBot/1.0',
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Error making authenticated request:', error);
      throw error;
    }
  }

  /**
   * Récupérer les informations de l'utilisateur
   */
  async getUser(accessToken: string): Promise<CoinbaseUser> {
    const response = await this.makeAuthenticatedRequest(accessToken, '/v2/user');
    return response.data.data;
  }

  /**
   * Récupérer les comptes de l'utilisateur
   */
  async getAccounts(accessToken: string): Promise<CoinbaseAccount[]> {
    const response = await this.makeAuthenticatedRequest(accessToken, '/v2/accounts');
    return response.data.data;
  }

  /**
   * Récupérer un compte spécifique
   */
  async getAccount(accessToken: string, accountId: string): Promise<CoinbaseAccount> {
    const response = await this.makeAuthenticatedRequest(accessToken, `/v2/accounts/${accountId}`);
    return response.data.data;
  }

  /**
   * Récupérer le solde d'une cryptomonnaie spécifique
   */
  async getBalance(accessToken: string, currency: string): Promise<number> {
    try {
      const accounts = await this.getAccounts(accessToken);
      const account = accounts.find(acc => 
        acc.currency.code.toLowerCase() === currency.toLowerCase()
      );
      
      return account ? parseFloat(account.balance.amount) : 0;
    } catch (error) {
      console.error(`Error getting balance for ${currency}:`, error);
      return 0;
    }
  }

  /**
   * Vérifier si un token est valide
   */
  async isTokenValid(accessToken: string): Promise<boolean> {
    try {
      await this.getUser(accessToken);
      return true;
    } catch (error) {
      return false;
    }
  }
}