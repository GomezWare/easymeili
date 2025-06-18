import type { APIRoute } from "astro";
import { MeiliSearch } from 'meilisearch';
import dotEnv from "dotenv";

dotEnv.config()

const client = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || 'http://127.0.0.1:7700',
  apiKey: process.env.MEILISEARCH_KEY || '',
});

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const key = url.searchParams.get('key');
    
    if (key) {
      // Obtener una clave específica
      try {
        const keyInfo = await client.getKey(key);
        return new Response(JSON.stringify(keyInfo), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (keyError) {
        console.error('Error getting key info:', keyError);
        return new Response(JSON.stringify({ error: 'Clave no encontrada' }), { status: 404 });
      }
    } else {
      // Obtener todas las claves
      const keys = await client.getKeys();
      return new Response(JSON.stringify({
        results: keys.results,
        total: keys.total,
        limit: keys.limit,
        offset: keys.offset
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (e) {
    console.error('Error in GET /api/keys:', e);
    return new Response(JSON.stringify({ error: 'Error al obtener claves' }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, description, indexes, actions, expiresAt } = body;

    // Validar parámetros
    if (!actions || !Array.isArray(actions) || actions.length === 0) {
      return new Response(JSON.stringify({ error: 'Se requieren acciones válidas' }), { status: 400 });
    }

    // Crear la clave
    const key = await client.createKey({
      name,
      description,
      indexes: indexes && indexes.length > 0 ? indexes : [], // MeiliSearch requiere este campo, incluso si es un array vacío
      actions,
      expiresAt: expiresAt || null // MeiliSearch requiere este campo, incluso si es null
    });

    return new Response(JSON.stringify(key), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Error in POST /api/keys:', e);
    return new Response(JSON.stringify({ error: 'Error al crear la clave' }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { key } = body;
    
    if (!key || typeof key !== 'string' || key.trim() === '') {
      return new Response(JSON.stringify({ error: 'Falta la clave a eliminar o no es válida' }), { status: 400 });
    }
    
    await client.deleteKey(key);
    return new Response(JSON.stringify({ mensaje: 'Clave eliminada correctamente' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Error in DELETE /api/keys:', e);
    return new Response(JSON.stringify({ error: 'Error al eliminar la clave' }), { status: 500 });
  }
}; 