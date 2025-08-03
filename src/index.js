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

app.post('/users', (req, res) => {
  const { name, age, email } = req.body;
  const newUser = {
    id: Date.now(),
    name,
    age,
    email
  };
  res.status(201).json(newUser);
});


// Simulación de base de datos con un array
const users = [{id: 1, name: 'Joaquin', age: 30, email: 'joaquintripp@example.com'}]; 

app.get('/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({
      error: 'User not found'
    });
  }
  res.json({id: user.id, name: user.name});
});


app.post('/users/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, age, email } = req.body;

  // Simulación de actualización (puedes reemplazar con tu lógica real)
  if (id === 1) {
    res.json({
      id,
      name,
      age,
      email
    });
  } else {
    res.status(404).json({
      error: 'User not found'
    });
  }
});


app.post('/products', (req, res) => {
  const {
    name,
    description,
    price,
    category,
    tags,
    inStock,
    specifications,
    ratings
  } = req.body;

  // Validaciones básicas según el esquema
  if (
    typeof name !== 'string' || name.length < 2 || name.length > 100 ||
    typeof price !== 'number' || price < 0 || price % 0.01 !== 0 ||
    !['electronics', 'clothing', 'books', 'home', 'beauty'].includes(category)
  ) {
    return res.status(400).json({ error: 'Invalid product data' });
  }

  if (description && description.length > 500) {
    return res.status(400).json({ error: 'Description too long' });
  }

  if (tags && (!Array.isArray(tags) || tags.length < 1 || tags.some(tag => typeof tag !== 'string'))) {
    return res.status(400).json({ error: 'Tags must be a non-empty array of strings' });
  }

  if (ratings && Array.isArray(ratings)) {
    for (const rating of ratings) {
      if (
        typeof rating.score !== 'number' ||
        rating.score < 1 ||
        rating.score > 5 ||
        typeof rating.comment !== 'string' ||
        rating.comment.length > 500
      ) {
        return res.status(400).json({ error: 'Invalid rating data' });
      }
    }
  }

  // Simulación de creación de producto
  const newProduct = {
    id: Date.now(),
    name,
    description,
    price,
    category,
    tags,
    inStock,
    specifications,
    ratings
  };

  res.status(201).json(newProduct);
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});