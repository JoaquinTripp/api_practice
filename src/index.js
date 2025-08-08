const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const OpenApiValidator = require('express-openapi-validator');
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'pistito';

const app = express();
const port = 3000;

const swaggerDocument = YAML.load('./src/openapi.yaml');

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(express.json());

function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, SECRET_KEY, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
}

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


app.get('/v1/hello', authenticateJWT, (req, res) => {
  res.json({ message: 'Hello, world!' });
});

app.get('/v2/hello', (req, res) => {
  res.json({ message: 'Hello, world!' , 
    version: 'v2',
    timestamp: new Date().toISOString()
  });
});


app.get('/v1/goodbye', (req, res) => {
  res.json({
    message: 'Goodbye, world!',
    description: 'This endpoint returns a farewell message.'
  });
});


app.get('/v1/greet', (req, res) => {
  const name = req.query.name || 'stranger';
  res.json({
    message: `Hello, ${name}!`,
    description: 'This endpoint returns a personalized greeting message.'
  });
});

app.post('/v1/users', (req, res) => {
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
const users = [{id: 1, name: 'Joaquin', age: 30, email: 'joaquintripp@example.com', password: '123456'}]; 


// Endpoint para autenticación
app.post('/v1/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  // Generar JWT
  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email },
    SECRET_KEY,
    { expiresIn: '1h' }
  );
  res.json({ token });
});


app.get('/v1/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({
      error: 'User not found'
    });
  }
  res.json({id: user.id, name: user.name});
});


app.post('/v1/users/:id', (req, res) => {
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


// Base de simulación para productos
const products = [
  {
    id: 1,
    name: 'Smartphone',
    description: 'Latest model smartphone with advanced features.',
    price: 699,
    category: 'electronics',
    tags: ['mobile', 'gadgets'],
    inStock: true,
    specifications: { color: 'black', memory: '128GB' },
    ratings: [
      { score: 5, comment: 'Excellent product!' },
      { score: 4, comment: 'Very good, but a bit expensive.' }
    ]
  },
  {
    id: 2,
    name: 'T-shirt',
    description: '100% cotton, comfortable fit.',
    price: 19,
    category: 'clothing',
    tags: ['fashion', 'summer'],
    inStock: true,
    specifications: { size: 'M', color: 'white' },
    ratings: [
      { score: 4, comment: 'Nice and comfy.' }
    ]
  }
];

// Crear un nuevo producto
app.post('/v1/products', (req, res) => {
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

  // Validaciones según el esquema Product
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

  const newProduct = {
    id: products.length ? products[products.length - 1].id + 1 : 1,
    name,
    description,
    price,
    category,
    tags,
    inStock,
    specifications,
    ratings
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

// Listar todos los productos
app.get('/v1/products', (req, res) => {
  res.json(products);
});

// Obtener producto por ID
app.get('/v1/products/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const product = products.find(p => p.id === id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

// Actualizar un producto por ID
app.put('/v1/products/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
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

  const productIndex = products.findIndex(p => p.id === id);
  if (productIndex === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  // Validaciones según el esquema Product
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

  // Actualizar el producto
  const updatedProduct = {
    id,
    name,
    description,
    price,
    category,
    tags,
    inStock,
    specifications,
    ratings
  };
  products[productIndex] = updatedProduct;
  res.json(updatedProduct);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`http://localhost:${port}/v1`);
  console.log(`http://localhost:${port}/v2`);
});