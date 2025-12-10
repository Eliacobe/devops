const express = require('express');
const bodyParser = require('body-parser');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
app.use(bodyParser.json());

// ---- PROXY ROUTES ----

// Forward /weather/* to weather service
app.use('/weather', createProxyMiddleware({
  target: 'http://weather:5000',
  changeOrigin: true,
  pathRewrite: { '^/weather': '' }
}));

// Forward /catalog/* → catalog service
app.use('/catalog', createProxyMiddleware({
  target: 'http://catalog:4003',
  changeOrigin: true,
  pathRewrite: { '^/catalog': '' }
}));

// Forward /booking/* → booking service
app.use('/booking', createProxyMiddleware({
  target: 'http://booking:4002',
  changeOrigin: true,
  pathRewrite: { '^/booking': '' }
}));

app.get('/', (req, res) => {
  res.send('API Gateway is running!');
});

const port = 3000;
app.listen(port, () => {
  console.log(`API Gateway running on port ${port}`);
});
