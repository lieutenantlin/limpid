export interface ApiGatewayJwtClaims {
  [key: string]: string | undefined;
}

export interface ApiGatewayEvent {
  version?: string;
  rawPath: string;
  headers?: Record<string, string | undefined>;
  body?: string | null;
  isBase64Encoded?: boolean;
  pathParameters?: Record<string, string | undefined>;
  queryStringParameters?: Record<string, string | undefined>;
  requestContext?: {
    http?: {
      method?: string;
      path?: string;
    };
    authorizer?: {
      jwt?: {
        claims?: ApiGatewayJwtClaims;
      };
    };
  };
}

export interface ApiGatewayResult {
  statusCode: number;
  headers?: Record<string, string>;
  body?: string;
}
