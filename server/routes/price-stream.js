'use strict';

const express = require('express');
const { createRealtimePriceService } = require('../services/realtime-price-service');

function createPriceStreamRouter({ service = createRealtimePriceService() } = {}) {
  const router = express.Router();
  let sequence = 0;

  router.get('/prices/live', (_req, res) => {
    service.start();
    const snapshot = service.getSnapshot();
    if (!snapshot) {
      return res.status(503).json({
        ok: false,
        error: { code: 'PRICE_UNAVAILABLE', message: 'No live price is available.' },
      });
    }

    res.set({ 'Cache-Control': 'no-store, no-transform' });
    return res.json({
      ok: true,
      data: snapshot,
      meta: {
        timestamp: snapshot.timestampUtc,
        source: snapshot.provider,
        freshness: snapshot.isFallback ? 'fallback' : snapshot.isFresh ? 'live' : 'stale',
      },
    });
  });

  router.get('/prices/stream', (req, res) => {
    service.start();
    // This route is intentionally long-lived; scope the timeout override to
    // the SSE request instead of disabling timeouts for the whole server.
    req.setTimeout(0);
    res.setTimeout(0);
    res.status(200);
    res.set({
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream; charset=utf-8',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders?.();

    let closed = false;
    const send = (quote) => {
      if (closed || !quote) return;
      sequence += 1;
      res.write(
        `id: ${sequence}\nevent: price\ndata: ${JSON.stringify({ sequenceId: sequence, ...quote })}\n\n`
      );
    };
    const unsubscribe = service.subscribe((quote) => send(quote));
    send(service.getSnapshot());
    const heartbeat = setInterval(() => {
      if (!closed) res.write(': heartbeat\n\n');
    }, 15_000);
    heartbeat.unref?.();

    const close = () => {
      if (closed) return;
      closed = true;
      clearInterval(heartbeat);
      unsubscribe();
    };
    req.on('close', close);
    res.on('close', close);
  });

  router.get('/prices/stream/status', (_req, res) => {
    res.json({
      ok: true,
      data: {
        snapshot: service.getSnapshot(),
        providerFailures: service.getProviderFailures(),
      },
    });
  });

  return router;
}

module.exports = { createPriceStreamRouter };
