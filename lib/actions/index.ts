'use server';

import { revalidatePath } from 'next/cache';
import { connectToDb } from './../mongoose';
import { scrapeAmazonProduct } from '../scraper';
import Product from '../models/product.model';
import { getAveragePrice, getHighestPrice, getLowestPrice } from '../utils';

export async function scrapeAndStoreProduct(productUrl: string) {
  if (!productUrl) return;

  try {
    connectToDb();
    const scrapedProduct = await scrapeAmazonProduct(productUrl);

    if (!scrapedProduct) return;

    // find/create the product in the db
    let product = scrapedProduct;

    const existingProduct = await Product.findOne({ url: scrapedProduct.url });

    if (existingProduct) {
      const updatedPriceHistory: any = [
        ...existingProduct.priceHistory,
        { price: scrapedProduct.currentPrice },
      ];

      product = {
        ...scrapedProduct,
        priceHistory: updatedPriceHistory,
        lowestPrice: getLowestPrice(updatedPriceHistory),
        highestPrice: getHighestPrice(updatedPriceHistory),
        averagePrice: getAveragePrice(updatedPriceHistory),
      };
    }

    // upsert -> if it doesnt yet exist, create a new product in the db
    // new ->  if true, return the modified document rather than the original. defaults to false
    const newProduct = await Product.findOneAndUpdate(
      {
        url: scrapedProduct.url,
      },
      product,
      { upsert: true, new: true }
    );

    // revalidate path to automtically update it, otherwise stuck in cache
    // page is going to change because it is modified
    revalidatePath(`/products/${newProduct._id}`);
  } catch (error: any) {
    throw new Error('Failed to create/update product : ${error.message}');
  }
}

export async function getProductById(productId: string) {
  try {
    connectToDb();

    const product = await Product.findOne({ _id: productId });

    if (!product) return null;

    return product;
  } catch (error) {
    console.log(error);
  }
}

export async function getAllProducts() {
  try {
    connectToDb();

    const products = await Product.find();

    return products;
  } catch (error) {
    console.log(error);
  }
}

export async function getSimilarProducts(productId: string) {
  try {
    connectToDb();

    const currProduct = await Product.findById(productId);

    if (!currProduct) return null;

    const similarProducts = await Product.find({
      _id: { $ne: productId },
    }).limit(3);

    return similarProducts;
  } catch (error) {
    console.log(error);
  }
}
