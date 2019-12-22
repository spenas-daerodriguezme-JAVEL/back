import express from 'express';
import users from '../routes/user';
import products from '../routes/product';
import auth from '../routes/auth';


export default function(app: express.Express) {
  app.use(express.json());
  app.use('/api/users', users.router);
  app.use('/api/product', products.router);
  app.use('/auth', auth.router);
}