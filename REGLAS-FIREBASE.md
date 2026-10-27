# Reglas de Firebase para el panel de la página web

El panel (`admin.html`) guarda los carros en **colecciones nuevas** de tu proyecto
`sistema-yesica`. No toca la colección `vehiculos` del centro de control.

- `web_autos`: inventario de la página
- `web_entregados`: carros entregados / vendidos
- Fotos en Storage: carpeta `web/`

## 1. Firestore → Reglas

**No borres tus reglas actuales.** Solo pega este bloque *dentro* de
`match /databases/{database}/documents { ... }`, junto a las reglas que ya tienes:

```
    // ===== Página web: cualquiera puede ver, solo administradores editan =====
    match /web_autos/{id} {
      allow read: if true;
      allow write: if request.auth != null
        && request.auth.token.email in ['alfre@yesica.local', 'yesica@yesica.local'];
    }
    match /web_entregados/{id} {
      allow read: if true;
      allow write: if request.auth != null
        && request.auth.token.email in ['alfre@yesica.local', 'yesica@yesica.local'];
    }
```

Luego toca **Publicar**.

## 2. Storage → Reglas

Igual: pega este bloque *dentro* de `match /b/{bucket}/o { ... }`, junto a lo que ya tienes:

```
    // ===== Fotos de la página web =====
    match /web/{all=**} {
      allow read: if true;
      allow write: if request.auth != null
        && request.auth.token.email in ['alfre@yesica.local', 'yesica@yesica.local']
        && (request.resource == null
            || (request.resource.size < 10 * 1024 * 1024
                && request.resource.contentType.matches('image/.*')));
    }
```

Luego toca **Publicar**.

## Agregar otro administrador

Agrega su correo (`usuario@yesica.local`) en las dos reglas y en `ADMINS` dentro de `admin.html`.
