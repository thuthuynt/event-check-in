import { createRequestHandler } from "react-router";
import { handleAPIRequest } from "./api";
import { handleMockAPIRequest } from "./mock-api";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle API routes
    if (url.pathname.startsWith('/api/')) {
      // Check if we have Cloudflare services available
      if (env && env.DUCKLYTICS_PROD && env.EVENT_STORAGE) {
        return handleAPIRequest(request, env.DUCKLYTICS_PROD, env.EVENT_STORAGE, env.JWT_SECRET);
      } else {
        // Use mock API for local development
        return handleMockAPIRequest(request);
      }
    }
    
    // Handle all other routes with React Router
    return requestHandler(request, {
      cloudflare: { env, ctx },
    });
  },
} satisfies ExportedHandler<Env>;
