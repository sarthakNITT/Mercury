import { FastifyInstance } from "fastify";
import proxy from "@fastify/http-proxy";

interface ProxyOptions {
  upstream: string;
  prefix: string;
  rewritePrefix: string;
  isSSE?: boolean;
  timeout?: number;
  proxyOptions?: any;
}

export async function registerProxy(
  fastify: FastifyInstance,
  {
    upstream,
    prefix,
    rewritePrefix,
    isSSE = false,
    timeout,
    proxyOptions = {},
  }: ProxyOptions,
) {
  fastify.register(proxy, {
    upstream,
    prefix,
    rewritePrefix,
    http2: false,
    // proxyPayloads: true, // This is default true usually.
    // retryCount: 1, // Retry once
    ...(timeout ? { http: { requestOptions: { timeout } } } : {}),
    ...proxyOptions,
    replyOptions: {
      rewriteRequestHeaders: (request, headers) => {
        return {
          ...headers,
          "x-service-key": process.env.SERVICE_KEY || "dev-service-key",
          "x-trace-id": request.id as string,
        };
      },
      ...(isSSE
        ? {
            getUpstream: (req: any, base: any) => {
              return base;
            },
            onResponse: (request: any, reply: any, res: any) => {
              reply.raw.setHeader("Content-Type", "text/event-stream");
              reply.raw.setHeader("Cache-Control", "no-cache");
              reply.raw.setHeader("Connection", "keep-alive");
              reply.send(res);
            },
          }
        : {}),
    },
  });
}
