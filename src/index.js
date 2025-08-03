const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const OpenApiValidator = require('express-openapi-validator');

const app = express();
const port = 3000;

const swaggerDocument = YAML.load('./src/openapi.yaml');

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(express.json());

app.use(
  OpenApiValidator.middleware({
    apiSpec: swaggerDocument,
    validateRequests: true,
    validateResponses: true,
    ignorePaths: /.*\/docs.*/, // ignore the docs path
  })
);


app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    message: err.message,
    errors: err.errors,
  });
});


app.get('/hello', (req, res) => {
  res.json({ message: 'Hello, world!' });
});


app.get('/goodbye', (req, res) => {
  res.json({
    message: 'Goodbye, world!',
    description: 'This endpoint returns a farewell message.'
  });
});


app.get('/greet', (req, res) => {
  const name = req.query.name || 'stranger';
  res.json({
    message: `Hello, ${name}!`,
    description: 'This endpoint returns a personalized greeting message.'
  });
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});