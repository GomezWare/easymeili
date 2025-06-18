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
    // Obtener información básica del sistema
    const [indexes, keys, version, health] = await Promise.all([
      client.getIndexes(),
      client.getKeys(),
      client.getVersion(),
      client.health()
    ]);

    // Calcular estadísticas de documentos
    let totalDocuments = 0;
    const topIndexes = [];

    for (const index of indexes.results) {
      try {
        const indexClient = client.index(index.uid);
        const documents = await indexClient.getDocuments();
        const documentCount = documents.total;
        totalDocuments += documentCount;
        
        topIndexes.push({
          uid: index.uid,
          totalDocuments: documentCount
        });
      } catch (error) {
        console.error(`Error getting documents for index ${index.uid}:`, error);
        topIndexes.push({
          uid: index.uid,
          totalDocuments: 0
        });
      }
    }

    // Ordenar índices por número de documentos
    topIndexes.sort((a, b) => b.totalDocuments - a.totalDocuments);

    // Calcular tamaño aproximado de la base de datos (simulado)
    const databaseSize = totalDocuments * 1024; // 1KB por documento aproximado

    const stats = {
      totalIndexes: indexes.total,
      totalDocuments,
      totalKeys: keys.total,
      databaseSize,
      topIndexes: topIndexes.slice(0, 5), // Top 5 índices
      version: version.pkgVersion,
      lastUpdate: new Date().toISOString(),
      status: health.status,
      responseTime: 0 // Se calcula en el frontend
    };

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Error in GET /api/stats:', e);
    return new Response(JSON.stringify({ error: 'Error al obtener estadísticas' }), { status: 500 });
  }
}; 