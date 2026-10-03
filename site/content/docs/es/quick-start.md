---
description: De una instalación limpia a tu primer prompt por el endpoint local en cuatro pasos.
group: Primeros pasos
order: 3
---
# Inicio rápido

Esta guía usa CLIProxyAPI, el motor por defecto. Los pasos son los mismos para los demás.

1. **Arranca el motor.** Abre **Proveedores**, elige la pestaña CLIProxyAPI y pulsa el botón de play junto al endpoint. El indicador de estado de la barra lateral se pone en verde cuando el motor está en marcha.
2. **Conecta un proveedor.** En la misma pestaña, haz clic en **Agregar Cuenta** en un proveedor como Claude u OpenAI y termina el inicio de sesión en el navegador. Para proveedores con clave API, haz clic en el icono de la llave y pega tu clave.
3. **Revisa los modelos.** La sección **Modelos disponibles** lista todos los modelos que expone el motor en marcha. Si está vacía, el motor no está arrancado o no hay ninguna cuenta conectada.
4. **Configura tu agente.** Abre **Agentes**, haz clic en **Configurar** junto a un agente instalado, elige los modelos y pulsa **Aplicar**. Tunnel Agent escribe el fichero de configuración del agente y guarda una copia de seguridad.

Ya está: usa tu agente como siempre y sus peticiones pasarán por el endpoint local.

## Con cualquier otro cliente

Usa un cliente que admita los endpoints compatibles con OpenAI y los modelos del motor elegido. Copia el endpoint de la cabecera de Proveedores y una clave local de cliente de **Configuración → CLIProxyAPI → Claves API**:

```bash
export OPENAI_BASE_URL=http://127.0.0.1:8317/v1
export OPENAI_API_KEY='tu-clave-local-de-cliente'

curl "$OPENAI_BASE_URL/models" -H "Authorization: Bearer $OPENAI_API_KEY"
```

> [!TIP]
> Activa **Configuración → CLIProxyAPI → Inicio automático** para que el motor arranque con la app, y **General → Iniciar al login** para mantener Tunnel Agent en la bandeja del sistema.
