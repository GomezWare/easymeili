# Guía de Despliegue - EasyMeili

Esta guía te ayudará a desplegar EasyMeili usando Docker y Docker Compose.

## Prerrequisitos

- Docker
- Docker Compose
- Git

## Despliegue Rápido

### 1. Clonar el repositorio
```bash
git clone <tu-repositorio>
cd easymeili
```

### 2. Configurar variables de entorno
```bash
# Copiar el archivo de ejemplo
cp env.example .env

# Editar las variables de entorno
nano .env
```

**Variables importantes:**
- `MEILISEARCH_KEY`: Clave maestra de MeiliSearch (cambia `your_master_key_here` por una clave segura)
- `MEILISEARCH_HOST`: URL de MeiliSearch (por defecto: `http://localhost:7700`)

### 3. Desplegar con Docker Compose
```bash
# Construir y ejecutar los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Verificar estado
docker-compose ps
```

### 4. Acceder a la aplicación
- **EasyMeili**: http://localhost:3000
- **MeiliSearch**: http://localhost:7700

## Despliegue Manual con Docker

### 1. Construir la imagen
```bash
docker build -t easymeili .
```

### 2. Ejecutar MeiliSearch
```bash
docker run -d \
  --name meilisearch \
  -p 7700:7700 \
  -e MEILI_MASTER_KEY=your_master_key_here \
  -v meili_data:/meili_data \
  getmeili/meilisearch:latest
```

### 3. Ejecutar EasyMeili
```bash
docker run -d \
  --name easymeili \
  -p 3000:3000 \
  -e MEILISEARCH_HOST=http://host.docker.internal:7700 \
  -e MEILISEARCH_KEY=your_master_key_here \
  easymeili
```

## Variables de Entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `MEILISEARCH_HOST` | URL de MeiliSearch | `http://localhost:7700` |
| `MEILISEARCH_KEY` | Clave maestra de MeiliSearch | - |
| `NODE_ENV` | Entorno de Node.js | `production` |
| `HOST` | Host de la aplicación | `0.0.0.0` |
| `PORT` | Puerto de la aplicación | `3000` |

## Comandos Útiles

### Docker Compose
```bash
# Iniciar servicios
docker-compose up -d

# Detener servicios
docker-compose down

# Reiniciar servicios
docker-compose restart

# Ver logs
docker-compose logs -f easymeili
docker-compose logs -f meilisearch

# Reconstruir y reiniciar
docker-compose up -d --build

# Eliminar todo (incluyendo volúmenes)
docker-compose down -v
```

### Docker
```bash
# Ver contenedores
docker ps

# Ver logs
docker logs easymeili-app
docker logs easymeili-meilisearch

# Ejecutar comandos dentro del contenedor
docker exec -it easymeili-app sh

# Eliminar contenedores
docker rm -f easymeili-app easymeili-meilisearch
```

## Solución de Problemas

### La aplicación no se conecta a MeiliSearch
1. Verifica que MeiliSearch esté ejecutándose:
   ```bash
   docker-compose ps
   ```

2. Verifica los logs de MeiliSearch:
   ```bash
   docker-compose logs meilisearch
   ```

3. Asegúrate de que las variables de entorno estén correctas:
   ```bash
   docker-compose exec easymeili env | grep MEILI
   ```

### Error de permisos
Si tienes problemas de permisos en Linux:
```bash
# Cambiar permisos del directorio
sudo chown -R $USER:$USER .

# O ejecutar docker-compose con sudo
sudo docker-compose up -d
```

### Puerto ya en uso
Si el puerto 3000 o 7700 ya están en uso:
1. Cambia los puertos en `docker-compose.yml`
2. O detén los servicios que usan esos puertos

## Producción

Para despliegue en producción:

1. **Cambia la clave maestra** por una clave segura
2. **Configura HTTPS** usando un proxy reverso (nginx, traefik)
3. **Configura backups** del volumen de MeiliSearch
4. **Monitorea los logs** y métricas
5. **Configura variables de entorno** específicas para producción

### Ejemplo con Nginx
```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Seguridad

- ✅ Usa claves maestras seguras
- ✅ No expongas MeiliSearch directamente a internet
- ✅ Configura HTTPS en producción
- ✅ Mantén las imágenes actualizadas
- ✅ Monitorea los logs regularmente 