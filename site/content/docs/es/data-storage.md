---
description: Dónde guarda Tunnel Agent los ajustes, los binarios de los motores, las credenciales y los tokens de sesión en cada plataforma.
group: Referencia
order: 9
---
# Datos y privacidad

Tus ajustes y credenciales se quedan en tu equipo. Tunnel Agent habla con GitHub para descargar releases y con tus proveedores en tu nombre; el proyecto no tiene ningún servidor propio.

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

**Restablecer todas las credenciales** y **Restablecer cuentas de sesión**, en [Configuración](configuration.md), hacen una copia de los ficheros en una carpeta `.backup/` con fecha y hora antes de borrarlos.
