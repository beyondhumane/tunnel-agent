---
description: Soluciones para los problemas más comunes con motores, puertos, modelos, agentes y cuota.
group: Referencia
order: 10
---
# Solución de problemas

## El motor no arranca

- Revisa **Registros → Registros del Proxy** para ver la salida del propio motor.
- Puede que otro programa esté usando el puerto. Cámbialo en [Configuración](configuration.md) y reinicia el motor.
- Para 9Router, asegúrate de tener instalado Node.js 18 o posterior y en el `PATH`, y reinicia Tunnel Agent.

## No aparece ningún modelo

La lista de modelos viene del motor en marcha. Arráncalo y conecta al menos una cuenta. Para las cadenas de fallback, CLIProxyAPI tiene que estar en marcha para que Tunnel Agent pueda leer `/v1/models`.

## Mi agente sigue hablando directamente con el proveedor

- Comprueba que el agente aparece como **Configurado** en **Agentes**.
- Reinicia el agente: la mayoría de CLI solo leen su configuración al arrancar.
- Las variables de entorno como `ANTHROPIC_BASE_URL` u `OPENAI_BASE_URL` definidas en tu shell tienen prioridad sobre los ficheros de configuración.

## Las peticiones fallan con 401

El cliente no está enviando una clave que acepte el motor. Copia una de **Configuración → Claves API** o vuelve a configurar el agente.

## La cuota muestra un error

Consulta la tabla de [Cuota](quota.md#cuando-algo-falla). La mayoría de errores se arreglan volviendo a iniciar sesión en el proveedor.

## Falla la compilación desde el código fuente en Windows

Cierra Tunnel Agent antes de compilar: Windows bloquea `TunnelAgent.exe` mientras está abierto.

## ¿Sigues atascado?

Abre un [issue](https://github.com/beyondhumane/tunnel-agent/issues) con tu sistema operativo, la versión de la app, los pasos para reproducirlo y las líneas de registro relevantes. Quita tokens y emails antes de publicarlo. Los problemas de seguridad van por la [política de seguridad](https://github.com/beyondhumane/tunnel-agent/blob/main/SECURITY.md), no por issues públicos.
