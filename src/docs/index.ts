export default {
  getDocHTML: (version = 'v1'): string => `<!DOCTYPE html>
  <html>
    <head>
      <title>NR Permitting Exchange, Aggregation and Collection Hub (PEACH) API - Documentation ${version}</title>
      <!-- Needed for adaptive design -->
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">

      <!-- ReDoc doesn't change outer page styles -->
      <style>body { margin: 0; padding: 0; }</style>
    </head>
    <body>
      <redoc spec-url='/docs/openapi.yaml' />
      <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
    </body>
  </html>`
};
