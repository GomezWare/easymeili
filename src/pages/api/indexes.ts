import type { APIRoute } from "astro";
import { MeiliSearch } from 'meilisearch';

const client = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || 'http://127.0.0.1:7700',
  apiKey: process.env.MEILISEARCH_KEY || '',
});

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const uid = url.searchParams.get('uid');
    if (uid) {
      const index = await client.index(uid).getRawInfo();
      return new Response(JSON.stringify(index), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      const indices = await client.getIndexes();
      return new Response(JSON.stringify(indices), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Error al obtener los índices' }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { uid, primaryKey } = body;
    if (!uid) {
      return new Response(JSON.stringify({ error: 'Falta el uid del índice' }), { status: 400 });
    }
    const index = await client.createIndex(uid, { primaryKey });
    return new Response(JSON.stringify(index), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Error al crear el índice' }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { uid } = body;
    if (!uid) {
      return new Response(JSON.stringify({ error: 'Falta el uid del índice' }), { status: 400 });
    }
    const res = await client.index(uid).delete();
    return new Response(JSON.stringify(res), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Error al borrar el índice' }), { status: 500 });
  }
};

export const PATCH: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { uid, primaryKey } = body;
    if (!uid || !primaryKey) {
      return new Response(JSON.stringify({ error: 'Faltan parámetros' }), { status: 400 });
    }
    const res = await client.index(uid).update({ primaryKey });
    return new Response(JSON.stringify(res), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Error al modificar el índice' }), { status: 500 });
  }
};
