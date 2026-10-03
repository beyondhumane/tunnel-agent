---
description: Dónde guarda Tunnel Agent los ajustes, los binarios de los motores, las credenciales y los tokens de sesión en cada plataforma.
group: Referencia
order: 9
---
# Datos y privacidad

Tus ajustes y ficheros de credenciales se quedan en tu equipo. Los motores envían los prompts al proveedor elegido y se aplican sus políticas de datos. Tunnel Agent contacta con GitHub para las releases, npm para 9Router y models.dev para los precios de modelos; el proyecto no aloja un servicio de proxy propio.

## Ajustes

| Plataforma | Ruta |
| --- | --- |
| Windows | `%AppData%\TunnelAgent\settings.json` |
| macOS | `~/Library/Preferences/TunnelAgent/settings.json` |
| Linux | `~/.config/TunnelAgent/settings.json` |

## Binarios de los motores

| Plataforma | Ruta |
| --- | --- |
| Windows | `%LocalAppData%\TunnelAgent\engine\` |
| macOS | `~/Library/Application Support/TunnelAgent/engine/` |
| Linux | `~/.local/share/TunnelAgent/engine/` |

9Router guarda sus propios datos de ejecución en `%APPDATA%\9router` en Windows y en `~/.9router` en macOS y Linux.

## Credenciales

Los tokens OAuth y las claves personalizadas de CLIProxyAPI están en `~/.cli-proxy-api/` (`%UserProfile%\.cli-proxy-api\` en Windows). Esta carpeta pertenece a CLIProxyAPI; Tunnel Agent solo toca los ficheros que gestiona.

Los tokens de sesión de Perplexity se guardan en un fichero por cuenta dentro de `perplexity-accounts/` en la carpeta de ajustes.

> [!WARNING]
> Los tokens se guardan en texto plano, protegidos por los permisos de ficheros de tu sistema operativo. No compartas estas carpetas ni las subas a un repositorio.

## Restablecer

**Restablecer todas las credenciales** y **Restablecer cuentas de sesión**, en [Configuración](configuration.md), copian los ficheros a `credential-backups/<marca-de-tiempo>/` dentro del directorio de datos locales de la app antes de borrarlos. Las copias de Perplexity usan una subcarpeta `perplexity/`. También contienen credenciales en texto plano; en Unix los ficheros son exclusivos del usuario (`0600`) y en Windows se usan los permisos del perfil de usuario.

Las copias de más de siete días se eliminan al inicializar los proveedores y al ejecutar operaciones de copia/restablecimiento, no con un temporizador continuo. Es posible recuperar manualmente los ficheros restantes; no hay restauración desde la app. Estas copias son independientes de las [copias de configuración de agentes](agents.md).
