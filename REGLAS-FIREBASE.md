# Firebase de la página web (proyecto `catalogo-yesica`)

Separado del centro de control (`sistema-yesica`). Ya quedó configurado:

- **Firestore** (nam5) con colecciones `web_autos`, `web_entregados` y `config/admins`
- **Login con Google** (solo correos en `config/admins` → `emails`)
- **Dominio autorizado:** `alfredoartero.github.io`
- **Reglas de Firestore** publicadas (abajo, como respaldo)

Para agregar o quitar administradores: en el panel, botón **Administradores**.

## Reglas de Firestore (ya publicadas)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null
        && request.auth.token.email_verified == true
        && request.auth.token.email in get(/databases/$(database)/documents/config/admins).data.emails;
    }
    match /web_autos/{id}      { allow read: if true; allow write: if isAdmin(); }
    match /web_entregados/{id} { allow read: if true; allow write: if isAdmin(); }
    match /config/admins       { allow read: if request.auth != null; allow write: if isAdmin(); }
  }
}
```

## Storage (pendiente: requiere plan Blaze)

1. Firebase → **Storage → Actualizar proyecto** → plan **Blaze** (sigue gratis hasta 5 GB).
   Recomendado: en Google Cloud → Facturación → Presupuestos, crea una alerta de **$1**.
2. **Storage → Comenzar** (ubicación US, modo producción).
3. **Storage → Reglas**, reemplaza todo por esto y toca **Publicar**:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /web/{all=**} {
      allow read: if true;
      allow write: if request.auth != null
        && request.auth.token.email_verified == true
        && request.auth.token.email in firestore.get(/databases/(default)/documents/config/admins).data.emails
        && (request.resource == null
            || (request.resource.size < 10 * 1024 * 1024
                && request.resource.contentType.matches('image/.*')));
    }
  }
}
```
