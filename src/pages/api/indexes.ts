import type { APIRoute } from "astro";
import { MeiliSearch } from 'meilisearch';
import dotEnv from "dotenv";
import { generateUid } from "../../utils/generateUid";

dotEnv.config()

const client = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || 'http://127.0.0.1:7700',
  apiKey: process.env.MEILISEARCH_KEY || '',
});

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const uid = url.searchParams.get('uid');
    const documents = url.searchParams.get('documents');
    
    if (uid !== null && typeof uid !== 'string') {
      return new Response(JSON.stringify({ error: 'El parámetro uid debe ser un string' }), { status: 400 });
    }
    if (uid && uid.trim() === '') {
      return new Response(JSON.stringify({ error: 'El parámetro uid no puede estar vacío' }), { status: 400 });
    }
    
    if (uid) {
      try {
        // Si se solicita obtener documentos del índice
        if (documents === 'true') {
          const index = client.index(uid);
          const [indexInfo, documentsList] = await Promise.all([
            index.getRawInfo(),
            index.getDocuments()
          ]);
          return new Response(JSON.stringify({
            ...indexInfo,
            createdAt: indexInfo.createdAt,
            updatedAt: indexInfo.updatedAt,
            documents: documentsList.results,
            total: documentsList.total,
            limit: documentsList.limit,
            offset: documentsList.offset
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        
        // Obtener información del índice
        const index = await client.index(uid).getRawInfo();
        return new Response(JSON.stringify({
          ...index,
          createdAt: index.createdAt,
          updatedAt: index.updatedAt
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (indexError) {
        console.error('Error getting index info:', indexError);
        return new Response(JSON.stringify({ error: 'Índice no encontrado' }), { status: 404 });
      }
    } else {
      // Obtener todos los índices con sus documentos
      const indices = await client.getIndexes();
      
      // Si se solicita incluir documentos, los agregamos a cada índice
      if (documents === 'true') {
        const indicesWithDocuments = await Promise.all(
          indices.results.map(async (index) => {
            try {
              const indexClient = client.index(index.uid);
              const [indexInfo, documentsList] = await Promise.all([
                indexClient.getRawInfo(),
                indexClient.getDocuments()
              ]);
              return {
                ...index,
                createdAt: indexInfo.createdAt,
                updatedAt: indexInfo.updatedAt,
                documents: documentsList.results,
                totalDocuments: documentsList.total,
                documentsLimit: documentsList.limit,
                documentsOffset: documentsList.offset
              };
            } catch (error) {
              console.error(`Error getting documents for index ${index.uid}:`, error);
              return {
                ...index,
                createdAt: index.createdAt,
                updatedAt: index.updatedAt,
                documents: [],
                totalDocuments: 0,
                documentsLimit: 0,
                documentsOffset: 0,
                documentsError: 'Error al obtener documentos'
              };
            }
          })
        );
        
        return new Response(JSON.stringify({
          results: indicesWithDocuments,
          total: indices.total,
          limit: indices.limit,
          offset: indices.offset
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      // Si no se solicitan documentos, devolver solo la información de los índices con fechas
      const indicesWithDates = await Promise.all(
        indices.results.map(async (index) => {
          try {
            const indexInfo = await client.index(index.uid).getRawInfo();
            return {
              ...index,
              createdAt: indexInfo.createdAt,
              updatedAt: indexInfo.updatedAt
            };
          } catch (error) {
            console.error(`Error getting info for index ${index.uid}:`, error);
            return {
              ...index,
              createdAt: index.createdAt,
              updatedAt: index.updatedAt
            };
          }
        })
      );
      
      return new Response(JSON.stringify({
        results: indicesWithDates,
        total: indices.total,
        limit: indices.limit,
        offset: indices.offset
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (e) {
    console.error('Error in GET /api/indexes:', e);
    return new Response(JSON.stringify({ error: 'Error al obtener índices' }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { uid } = body;

    if (uid && (typeof uid !== 'string' || uid.trim() === '')) {
      return new Response(JSON.stringify({ error: 'El uid debe ser un string no vacío si se proporciona' }), { status: 400 });
    }

    const index = await client.createIndex(uid);

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

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { uid, documents } = body;
    
    if (!uid || typeof uid !== 'string' || uid.trim() === '') {
      return new Response(JSON.stringify({ error: 'Falta el uid del índice o no es válido' }), { status: 400 });
    }
    
    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return new Response(JSON.stringify({ error: 'Se requieren documentos válidos para agregar' }), { status: 400 });
    }
    
    const index = client.index(uid);
    const result = await index.addDocuments(documents);
    
    return new Response(JSON.stringify({
      mensaje: 'Documentos agregados correctamente',
      taskUid: result.taskUid,
      documentsAdded: documents.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Error in PUT /api/indexes:', e);
    return new Response(JSON.stringify({ error: 'Error al agregar documentos al índice' }), { status: 500 });
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

