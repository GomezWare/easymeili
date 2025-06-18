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
    if (uid !== null && typeof uid !== 'string') {
      return new Response(JSON.stringify({ error: 'El parámetro uid debe ser un string' }), { status: 400 });
    }
    if (uid && uid.trim() === '') {
      return new Response(JSON.stringify({ error: 'El parámetro uid no puede estar vacío' }), { status: 400 });
    }
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
    if (!uid || typeof uid !== 'string' || uid.trim() === '') {
      return new Response(JSON.stringify({ error: 'Falta el uid del índice o no es válido' }), { status: 400 });
    }
    if (primaryKey && (typeof primaryKey !== 'string' || primaryKey.trim() === '')) {
      return new Response(JSON.stringify({ error: 'El primaryKey debe ser un string no vacío si se proporciona' }), { status: 400 });
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
    if (!uid || typeof uid !== 'string' || uid.trim() === '') {
      return new Response(JSON.stringify({ error: 'Falta el uid del índice o no es válido' }), { status: 400 });
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

export const UPDATE: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { uid, primaryKey } = body;
    if (!uid || typeof uid !== 'string' || uid.trim() === '') {
      return new Response(JSON.stringify({ error: 'Falta el uid del índice o no es válido' }), { status: 400 });
    }
    if (!primaryKey || typeof primaryKey !== 'string' || primaryKey.trim() === '') {
      return new Response(JSON.stringify({ error: 'Falta el primaryKey o no es válido' }), { status: 400 });
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

export const PATCH: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { uid } = body;
    if (!uid || typeof uid !== 'string' || uid.trim() === '') {
      return new Response(JSON.stringify({ error: 'Falta el uid del índice o no es válido' }), { status: 400 });
    }
    await client.index(uid).deleteAllDocuments();
    return new Response(JSON.stringify({ mensaje: 'Contenido del índice borrado correctamente' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Error al borrar el contenido del índice' }), { status: 500 });
  }
};

