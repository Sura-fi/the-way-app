import {
  HubConnectionBuilder,
  HubConnection,
  LogLevel,
} from "@microsoft/signalr";

const SIGNALR_URL =
  process.env.NEXT_PUBLIC_SIGNALR_URL || "http://localhost:5111/hubs/quote";

let connection: HubConnection | null = null;

/**
 * Creates (or returns existing) SignalR connection to the QuoteHub.
 * Passes JWT via query string because WebSockets can't use
 * the Authorization header during the handshake.
 */
export function getQuoteConnection(token: string): HubConnection {
  if (connection) return connection;

  connection = new HubConnectionBuilder()
    .withUrl(SIGNALR_URL, {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(LogLevel.Warning)
    .build();
  
    return connection;
  }
  
  /**
   * Stops and clears the connection (call on logout).
   */
  export async function stopQuoteConnection(): Promise<void> {
    if (connection) {
      await connection.stop();
      connection = null;
    }
  }
  