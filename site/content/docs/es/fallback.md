---
description: Crea modelos virtuales que pasan al modelo de otro proveedor cuando se agota la cuota.
group: Uso de Tunnel Agent
order: 6
---
# Fallback de modelos

El fallback de modelos es una función **experimental** de CLIProxyAPI. Un modelo virtual es un nombre que eliges, por ejemplo `my-opus-thinking`, asociado a una lista ordenada de modelos reales de proveedores. Cuando el primero se queda sin cuota, la petición pasa al siguiente.

## Cómo funciona

Con el fallback activado, Tunnel Agent ejecuta un pequeño puente local en el puerto público de CLIProxyAPI y mueve CLIProxyAPI a un puerto interno detrás de él. Tus agentes siguen usando el mismo endpoint.

Al desactivar el interruptor **Activar fallback** se detiene el puente. Al activarlo se arranca aunque no haya modelos virtuales; en ese caso el tráfico pasa sin cambios.

## Crear un modelo virtual

1. **Arranca CLIProxyAPI.** Tunnel Agent lee `/v1/models` del motor en marcha para listar los modelos que puedes asociar.
2. **Activa el fallback.** Abre **Fallback** y activa **Activar fallback**.
3. **Añade un modelo.** Haz clic en **Añadir modelo**, escribe un nombre y elige el primer modelo real.
4. **Añade entradas.** Usa **Añadir entrada** para sumar más modelos. Reordénalos con las flechas; una cadena necesita al menos una entrada.
5. **Úsalo.** Apunta tu agente al nombre del modelo virtual.

## Caché de rutas

Con **Cachear rutas que funcionan** activado, Tunnel Agent reutiliza la última entrada que funcionó durante el tiempo elegido (o hasta reiniciar) antes de volver a probar desde arriba. Usa **Reiniciar ruta cacheada** para empezar de cero, o **Usar esta ruta ahora** para fijar una entrada.

> [!NOTE]
> 9Router tiene su propio sistema de fallback, los **combos**, que se gestionan desde la pestaña 9Router de Proveedores.
