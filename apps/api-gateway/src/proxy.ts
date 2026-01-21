import { FastifyInstance } from "fastify";
import proxy from "@fastify/http-proxy";

interface ProxyOptions {
  upstream: string;
  prefix: string;
  rewritePrefix: string;
  isSSE?: boolean;
}

export async function registerProxy(
  fastify: FastifyInstance,
  { upstream, prefix, rewritePrefix, isSSE = false }: ProxyOptions,
) {
  fastify.register(proxy, {
    upstream,
    prefix,
    rewritePrefix,
    http2: false,
    // proxyPayloads: true, // This is default true usually.
    replyOptions: isSSE
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
      : undefined,
  });
}
