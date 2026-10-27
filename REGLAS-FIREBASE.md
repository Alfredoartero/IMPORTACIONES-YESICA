# Firebase de la página web (proyecto `catalogo-yesica`)

Separado del centro de control (`sistema-yesica`). Ya quedó configurado:

- **Firestore** (nam5) con colecciones `web_autos`, `web_entregados` y `config/admins`
- **Login con Google** (solo correos en `config/admins` → `emails`)
- **Dominio autorizado:** `alfredoartero.github.io`
- **Reglas de Firestore** publicadas (abajo, como respaldo)

Para agregar o quitar administradores: en el panel, botón **Administradores**.

## Reglas de Firestore (publicadas, versión reforzada)

- Cualquiera puede **ver** `web_autos` y `web_entregados`.
- Solo administradores pueden crear/editar/borrar, y cada carro se valida:
  solo campos conocidos, textos con tamaño máximo, máximo 40 fotos, link de Copart real.
- `config/admins` solo lo ven los administradores y **nunca puede quedar vacía** (mín. 1, máx. 10).
- Todo lo demás en la base de datos está **cerrado**.

El texto completo de las reglas está en Firebase → Firestore → Reglas.

## Storage (activado en US-EAST1, plan Blaze con alerta de $1)

Reglas publicadas (con el permiso "Aprovisionar reglas entre servicios" aceptado):

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

## Otras protecciones de la página

- **Content-Security-Policy** en todas las páginas: solo se cargan scripts del propio sitio
  (y de Google/Firebase en el panel).
- El panel no se puede abrir dentro de otra página (anti-clickjacking) y no aparece en Google (`noindex`).
- Los links de Copart solo se muestran si son `https://www.copart.com/...`.
- Las fotos solo se cargan de Firebase Storage o del propio sitio.
- Login solo con Google; la lista de administradores se maneja desde el panel.

## Recomendado (lo haces tú en Google Cloud)

1. **Restringir la API key** a tu sitio: Google Cloud → APIs y servicios → Credenciales →
   "Browser key (auto created by Firebase)" → Restricciones de aplicación: *Sitios web* →
   agrega `https://alfredoartero.github.io/*` y `https://catalogo-yesica.firebaseapp.com/*`.
2. **Verificación en dos pasos** en las cuentas de Google de los administradores.
