---
description: Ajustes generales de la app y opciones de cada motor para versiones, puertos, claves, enrutamiento y registros.
group: Referencia
order: 8
---
# Configuración

**Configuración** tiene una pestaña **General** y una pestaña por motor.

## General

| Ajuste | Qué hace |
| --- | --- |
| Tunnel Agent | Muestra la versión instalada y busca actualizaciones. |
| Verificación automática de actualizaciones | Busca una nueva versión en GitHub al iniciar. |
| Iniciar al login | Arranca automáticamente y se queda en la bandeja del sistema. |
| Tema | Sigue el sistema, o fuerza claro u oscuro. |
| Idioma | Uno de los 14 idiomas de la interfaz. |
| Ocultar información sensible | Sustituye los emails de las cuentas por puntos. |

## CLIProxyAPI

| Ajuste | Qué hace |
| --- | --- |
| Versión del motor | Instala una release concreta; las descargas se verifican con SHA256. |
| Inicio automático / Verificación automática / Actualización automática | Arranca con la app y mantiene el motor al día. |
| Ubicación de los ficheros de autenticación | Abre la carpeta con los tokens OAuth y las claves personalizadas. |
| Claves API | Claves que aceptan los clientes. La configuración de agentes usa la clave por defecto. |
| Panel de control web / Clave de gestión | Sirve la página de gestión de CLIProxyAPI; la clave es su contraseña. |
| Restablecer todas las credenciales | Hace copia y elimina los tokens y claves que gestiona Tunnel Agent. |
| Estrategia de enrutamiento | Round Robin o Fill First entre cuentas. |
| Puerto de escucha | Solo localhost. Requiere reiniciar. Por defecto `8317`. |
| Registros del proxy | Actualización automática e intervalo de refresco de la vista de registros. |

## Perplexity

Versión del motor y actualizaciones, la carpeta de cuentas, **Restablecer cuentas de sesión** y el puerto de escucha (por defecto `8327`).

## 9Router

Versión del motor y actualizaciones, contraseña de acceso al panel, **Requerir clave API**, claves API, la carpeta de instalación del motor, un acceso directo al panel local y el puerto de escucha (por defecto `20128`).

> [!NOTE]
> Dos motores no pueden compartir puerto. Si eliges uno que ya está en uso, Tunnel Agent te dice qué motor lo tiene.
