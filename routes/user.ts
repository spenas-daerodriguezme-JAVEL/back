import express from 'express';
import bcrypt from 'bcrypt';
import _ from 'lodash';
import Handlebars from 'handlebars';
import path from 'path';
import fs from 'fs';
import { User, validate } from '../models/user';
import { Reset } from '../models/resetPassword';
import { transport } from '../startup/mailer';
import auth from '../middleware/auth';
import adminAuth from '../middleware/adminAuth';

const router = express.Router();

const pickParams = (req: express.Request, isPost: Boolean) => {
  const parameters = [
    'name',
    'lastName',
    'email',
    'telephone',
    'address',
    'identificationType',
    'identificationNumber',
    'city',
    'state',
  ];
  if (isPost) parameters.push('password');
  return _.pick(req.body, parameters);
};

router.get('/me', auth, async (req: express.Request, res: express.Response) => {
  // eslint-disable-next-line no-underscore-dangle
  const id = req.header('id');
  if (!id) return res.status(400);
  const userFromDB = await User.findById(id).select('-password');
  const { user } = req as express.JRequest;
  if (userFromDB?._id.toString() !== user._id) {
    return res.status(400).send('Access denied');
  }

  return res.status(200).send(userFromDB);
});

router.get('/allUsers', [auth, adminAuth], async (req: express.Request, res: express.Response) => {
  try {
    const users = await User.find({}) as any;
    const returnUsers = users.map((user:any) => ({
      // eslint-disable-next-line no-underscore-dangle
      id: user._id,
      name: `${user.name} ${user.lastName}`,
      idNumber: user.identificationNumber,

    }));
    return res.status(200).send(returnUsers);
  } catch (error) {
    return res.status(500).send({
      message: 'There was an error retrieving users',
      error,
    });
  }
});

router.get('/userById/:identificationNumber', [auth, adminAuth], async (req: express.Request, res: express.Response) => {
  try {
    const user = await User.find({
      identificationNumber: req.params.identificationNumber,
    });
    if (user.length === 0) return res.status(404).send('User not found');
    return res.status(200).send(user);
  } catch (error) {
    return res.status(500).send({
      message: 'There was an error retirving user',
      error,
    });
  }
});

router.get('/userByIdBson/:id', [auth, adminAuth], async (req: express.Request, res: express.Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (user === null) return res.status(404).send('User not found');
    return res.status(200).send(user);
  } catch (error) {
    return res.status(500).send({
      message: 'There was an error retirving user',
      error,
    });
  }
});

router.post('/', async (req: express.Request, res: express.Response) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  try {
    let user = (await User.findOne({ email: req.body.email })) as any;
    if (user) return res.status(406).send({
      message:'User already registered.',
      key: 'email'
    });

    const userById = await User.findOne({ identificationNumber: req.body.identificationNumber });
    if (userById) return res.status(406).send({
      message: 'Identification Number cannot be duplicate.',
      key: 'id'
    });

    user = new User(
      pickParams(req, true),
    );

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);

    await user.save();
    const token = user.generateAuthToken();
    return res
      .status(200)
      .header('x-auth-token', token)
      // .send({ ..._.pick(user, ['_id', 'name', 'email']), token, mail });
      .send({ ..._.pick(user, ['_id', 'name', 'email']), token });
  } catch (errorMessage) {
    console.log(errorMessage);
    return res.status(500).send({
      message: 'There was an error creating user',
      errorMessage,
    });
  }
});

router.put('/', auth, async (req: express.Request, res: express.Response) => {
// router.put('/', async (req: express.Request, res: express.Response) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  try {
    // eslint-disable-next-line no-underscore-dangle
    const userId = (req as express.JRequest).user._id;
    const user = await User.findByIdAndUpdate(userId, pickParams(req, false));
    if (!user) return res.status(404).send('The user cannot be found');
    return res.status(200).send({
      message: 'Updated succesfully',
    });
  } catch (errorMessage) {
    return res.status(500).send({
      message: 'There was an error updating user',
      errorMessage,
    });
  }
});

router.put('/deactivate', auth, async (req: express.Request, res: express.Response) => {
  // router.put('/deactivate', async (req: express.Request, res: express.Response) => {
  // eslint-disable-next-line no-underscore-dangle
  const userId = (req as express.JRequest).user._id;
  try {
    const user = await User.findByIdAndUpdate(userId, {
      isActive: false,
    });
    if (!user) return res.status(404).send('The user cannot be found');
    return res.status(204).send('User deactivated succesfully');
  } catch (error) {
    return res.status(500).send({
      message: 'There was an error deactivating user',
      error,
    });
  }
});

router.put('/deactivate/:id', [auth, adminAuth], async (req: express.Request, res: express.Response) => {
// router.put('/deactivate/:id', async (req: express.Request, res: express.Response) => {
  // eslint-disable-next-line no-underscore-dangle
  const userId = req.params.id;
  try {
    const user = await User.findByIdAndUpdate(userId, {
      isActive: false,
    });
    if (!user) return res.status(404).send('The user cannot be found');
    return res.status(204).send('User deactivated succesfully');
  } catch (error) {
    return res.status(500).send({
      message: 'There was an error deactivating user',
      error,
    });
  }
});
router.put('/:id', [auth, adminAuth], async (req: express.Request, res: express.Response) => {
// router.put('/:id', async (req: express.Request, res: express.Response) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  // eslint-disable-next-line no-underscore-dangle
  const userId = req.params.id;

  try {
    const user = await User.findByIdAndUpdate(userId, pickParams(req, false));
    if (!user) return res.status(404).send('The user cannot be found');
    return res.status(204).send({
      message: 'Updated succesfully',
    });
  } catch (errorMessage) {
    if (errorMessage.codeName === 'DuplicateKey') {
      return res.status(400).send({
        message: 'Email already in use. Cannot be duplicate',
        errorMessage,
      });
    }
    return res.status(500).send({
      message: 'There was an error updating user',
      errorMessage,
    });
  }
});

router.delete('/:id', [auth, adminAuth], async (req: express.Request, res: express.Response) => {
// router.delete('/:id', async (req: express.Request, res: express.Response) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).send('The user cannot be found');
    return res.status(204).send('User deleted succesfully');
  } catch (error) {
    return res.status(500).send({
      message: 'There was an error deleting user',
      error,
    });
  }
});

// router.post('/reset-password', async (req: express.Request, res: express.Response) => {
//   const { email } = req.body;
//   const user = await User.findOne({
//     where: { email },
//   });
//   if (!user) {
//     return res.sendStatus(404);
//   }
//   const resetPassword = await Reset.findOne({
//     where: { userId: user._id, status: 0 },
//   });
// });
export default {
  router,
};
