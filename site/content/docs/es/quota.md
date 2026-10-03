---
description: Controla los límites de sesión y semanales de las cuentas conectadas y de los IDE independientes.
group: Uso de Tunnel Agent
order: 5
---
# Cuota

La pantalla **Cuota** muestra cuánto has usado de cada plan y cuándo se reinicia.

## Cuentas compatibles

| Origen | Proveedores |
| --- | --- |
| Cuentas de CLIProxyAPI | Claude, Codex, Devin, Antigravity, xAI |
| Cuentas de IDE independientes | Cursor, Kiro, Trae |
| Conexiones de 9Router | Límites de uso que informa 9Router |

Las cuentas de IDE independientes se detectan a partir del inicio de sesión local del IDE. Abre **Proveedores de cuota** y usa **Escanear** si falta alguna; tiene que estar instalado y con la sesión iniciada en este equipo.

## Cómo leer las barras

Cada cuenta lista sus ventanas, por ejemplo **Principal (5h)** y **Semanal**, con el porcentaje usado y el tiempo que falta para el reinicio. Algunos proveedores solo arrancan el contador cuando empiezas a usar la cuota.

Usa el botón de actualizar de una cuenta, o **Actualizar todo**, para obtener valores nuevos.

Las actualizaciones se ejecutan con eventos compatibles de la app (como el arranque, la primera visita a Cuota o la conexión de una cuenta) y peticiones manuales, no mediante sondeo continuo. Las ventanas y métricas dependen del proveedor; no todas las cuentas tienen ventanas de cinco horas y semanales.

## Cuando algo falla

| Mensaje | Qué hacer |
| --- | --- |
| La autenticación ha caducado | Vuelve a iniciar sesión en el proveedor y actualiza. |
| No se encontraron datos de autenticación locales | Abre el IDE, inicia sesión y actualiza. |
| La API de cuota tiene limitación de peticiones | Puede mostrar los últimos valores conocidos. Espera a que termine el periodo de espera y actualiza otra vez. |
| No hay datos de cuota disponibles | La cuenta no tiene un plan activo o el proveedor no ha devuelto uso. |

> [!TIP]
> Activa **Configuración → General → Ocultar información sensible** antes de compartir capturas: los emails de las cuentas se sustituyen por puntos.
