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

    // Validar parámetros requeridos
    if (!actions || !Array.isArray(actions) || actions.length === 0) {
      return new Response(JSON.stringify({ error: 'Se requieren acciones válidas' }), { status: 400 });
    }

    if (!indexes || !Array.isArray(indexes)) {
      return new Response(JSON.stringify({ error: 'Se requiere especificar índices' }), { status: 400 });
    }

    // Preparar los datos para MeiliSearch
    const keyData: any = {
      actions,
      indexes: indexes.length === 0 ? ["*"] : indexes, // Si no se especifican índices, usar ["*"] para todos
    };

    // Añadir campos opcionales solo si están definidos
    if (name && name.trim()) {
      keyData.name = name.trim();
    }

    if (description && description.trim()) {
      keyData.description = description.trim();
    }

    // Manejar expiresAt - convertir a formato RFC 3339 si se proporciona
    if (expiresAt) {
      try {
        // Verificar si ya está en formato ISO (RFC 3339 compatible)
        const date = new Date(expiresAt);
        if (isNaN(date.getTime())) {
          return new Response(JSON.stringify({ error: 'Fecha de expiración inválida' }), { status: 400 });
        }
        keyData.expiresAt = date.toISOString();
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Formato de fecha de expiración inválido' }), { status: 400 });
      }
    } else {
      keyData.expiresAt = null;
    }

    // Crear la clave
    const key = await client.createKey(keyData);

    return new Response(JSON.stringify(key), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('Error in POST /api/keys:', e);
    
    // Manejar errores específicos de MeiliSearch
    if (e.code === 'missing_master_key') {
      return new Response(JSON.stringify({ error: 'Se requiere configurar una master key para crear claves de API' }), { status: 401 });
    }
    
    if (e.code === 'invalid_api_key') {
      return new Response(JSON.stringify({ error: 'Clave de API inválida. Verifica la configuración de la master key.' }), { status: 401 });
    }
    
    if (e.code === 'invalid_key_actions') {
      return new Response(JSON.stringify({ error: 'Acciones de clave inválidas. Verifica las acciones especificadas.' }), { status: 400 });
    }
    
    if (e.code === 'invalid_key_indexes') {
      return new Response(JSON.stringify({ error: 'Índices de clave inválidos. Verifica los índices especificados.' }), { status: 400 });
    }
    
    if (e.code === 'invalid_key_expires_at') {
      return new Response(JSON.stringify({ error: 'Fecha de expiración inválida. Debe estar en formato RFC 3339.' }), { status: 400 });
    }

    return new Response(JSON.stringify({ 
      error: 'Error al crear la clave',
      details: e.message || 'Error desconocido'
    }), { status: 500 });
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