import express from 'express';
import _ from 'lodash';
import { Product, validate } from '../models/product';
import adminAuth from '../middleware/adminAuth';
import auth from '../middleware/auth';
import user from './user';

const router = express.Router();

const pickParams = (req: express.Request) => _.pick(req.body, [
  'name',
  'businessLine',
  'price',
  'classificator',
  'quantity',
  'description',
  'model',
  'physicalAspect',
  'smell',
  'color',
  'fragance',
  'gravity',
  'viscosity',
  'solubility',
  'flammable',
  'density',
  'ph',
  'activeComponent',
  'weight',
  'refractionIndex',
  'dilution',
  'isToxic',
  'paragraph1',
  'paragraph2',
  'paragraph3',
  'paragraph4',
  'stepTitle',
  'steps',
  'promoTitle',
]);

router.get(
  [
    '/',
    '/businessline/:businessline',
    '/price/:price',
    '/businessline/:businessline/price/:price',
  ],
  async (req: express.Request, res: express.Response) => {
    const { params } = req;
    let from: any = req.query.from || 0;
    from = Number(from * 11);

    const findObj: { [key: string]: any } = {};

    if (params.businessline) {
      const regexp = new RegExp(params.businessline, 'i');
      findObj.businessLine = regexp;
    }

    if (params.price) {
      const splitter = params.price.split('-');
      const priceObj = {
        $gte: splitter[0],
        $lte: splitter[1],
      };
      findObj.price = priceObj;
    }

    Product.find(findObj)
      .skip(from)
      .limit(11)
      .exec(async (err, products) => {
        if (err) {
          return res.status(500).json({
            err,
          });
        }

        Product.countDocuments(findObj, (err: any, count: number) => {
          res.json({
            products,
            pages: Math.ceil(count / 11),
          });
        });
      });

    // res.send(`Data: ${req.params.price}`).status(200);
  },
);

router.get('/search/:search', async (req: express.Request, res: express.Response) => {
  let from: any = req.query.from || 0;
  from = Number(from * 11);
  const { params } = req;
  const search = new RegExp(params.search, 'i');

  const findObj = {
    $or: [
      { name: search },
      { businessLine: search },
      { model: search },
      { description: search },
    ],
  };

  await Product.find(findObj)
    .skip(from)
    .limit(11)
    .exec((err, products) => {
      if (err) {
        res.status(500).send({
          err,
        });
      }
      if (!products) res.status(404).send();

      Product.countDocuments(findObj, (err: any, count: number) => {
        res.json({
          products,
          pages: Math.ceil(count / 11),
        });
      });
    });
});

router.get('/businesslinelist', (req: express.Request, res: express.Response) => {
  Product.find()
    .distinct('businessLine', (err, businessLines) => {
      if (err) res.status(500).send();
      res.status(200).send({
        businessLines,
      });
    });
});

// router.post("/", [auth, adminAuth],  async (req: express.Request, res: express.Response) => {
router.post('/', async (req: express.Request, res: express.Response) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const product = new Product(pickParams(req));

  await product.save();
  res.status(200).send({
    message: 'Product created succesfully',
    product,
  });
});

router.put('/:id', [auth, adminAuth], async (req: express.Request, res: express.Response) => {
// router.put("/:id", async (req: express.Request, res: express.Response) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const product = await Product.findByIdAndUpdate(req.params.id, pickParams(req));

  if (!product) return res.status(404).send('The product cannot be found.');

  res.status(200).send({
    message: 'Updated succesfully',
    product,
  });
});

// router.delete("/:id", [auth, adminAuth], async(req: express.Request, res: express.Response) => {
router.delete('/:id', async (req: express.Request, res: express.Response) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) res.status(404).send('The product cannot be found');

  res.status(200).send({
    message: 'Element deleted succesfully',
    product,
  });
});

export default {
  router,
};
