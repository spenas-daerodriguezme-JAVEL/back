import mongoose, { Schema, Document } from 'mongoose';
import Joi, { number, string } from 'joi';
import { Product } from './product';

const orderSchema = new mongoose.Schema({
  publicId: Number,
  user: {
    type: new mongoose.Schema({
      name: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 50,
      },
      lastName: {
        type: String,
        required: false,
        minlength: 2,
        maxlength: 50,
      },
      email: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 255,
      },
      telephone: {
        type: String,
        required: true,
        minlength: 7,
      },
      identificationType: {
        type: String,
        required: true,
      },
      identificationNumber: {
        type: Number,
        required: true,
        minlength: 2,
      },
      address: {
        type: String,
      },
      state: {
        type: String,
      },
      city: {
        type: String,
      },
      status: {
        type: String,
      },
    }),
  },

  products: [{
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    qty: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    productName: {
      type: String,
    },
    capacity: {
      type: String,
    },
    images: Array,
    businessLine: String,
  }],
  archived: {
    type: Boolean,
    default: false,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    required: true,
    default: 'PENDING',
  },
  dateCreated: {
    type: Date,
    required: true,
  },
  dateUpdated: {
    type: Date,
  },
  wompiId: {
    type: String,
  },
});

export const Order = mongoose.model('Order', orderSchema);

// export default {
//   Order,
// };
