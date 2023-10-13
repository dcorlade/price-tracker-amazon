import { sendEmail } from './../../lib/nodemailer/index';
import { getEmailNotifType } from './../../lib/utils';
import Product from '@/lib/models/product.model';
import { scrapeAmazonProduct } from '@/lib/scraper';
import { getAveragePrice, getHighestPrice, getLowestPrice } from '@/lib/utils';
import { connectToDb } from './../../lib/mongoose';
import { generateEmailBody } from '@/lib/nodemailer';
import { NextResponse } from 'next/server';
export async function GET() {
  try {
    // CRON JOB
    // rescrape all the products
    // update their price history and current prices
    // check if notification needs to be sent
    // find all users that subscribed to those products and send the emails

    connectToDb();
    const products = await Product.find({});

    if (!products) throw new Error(`Product not found`);

    // scrape latest product details and update db
    const updatedProducts = await Promise.all(
      products.map(async (currentProduct) => {
        const scrapedProduct = await scrapeAmazonProduct(currentProduct.url);

        if (!scrapedProduct) throw new Error('No such product');

        // 1 update product details

        const updatedPriceHistory = [
          ...currentProduct.priceHistory,
          { price: scrapedProduct.currentPrice },
        ];

        const product = {
          ...scrapedProduct,
          priceHistory: updatedPriceHistory,
          lowestPrice: getLowestPrice(updatedPriceHistory),
          highestPrice: getHighestPrice(updatedPriceHistory),
          averagePrice: getAveragePrice(updatedPriceHistory),
        };

        // upsert -> if it doesnt yet exist, create a new product in the db
        // new ->  if true, return the modified document rather than the original. defaults to false
        const updatedProduct = await Product.findOneAndUpdate(
          {
            url: scrapedProduct.url,
          },
          product
        );

        // check product status and send assigned mail
        const emailNotifType = getEmailNotifType(
          scrapedProduct,
          currentProduct
        );

        // also check if any user is subscribed to that product
        if (emailNotifType && updatedProduct.users.length > 0) {
          const productInfo = {
            title: updatedProduct.title,
            url: updatedProduct.url,
          };

          const emailContent = await generateEmailBody(
            productInfo,
            emailNotifType
          );

          const userEmails = updatedProduct.users.map((user: any) => {
            user.email;
          });

          // send the emails
          await sendEmail(emailContent, userEmails);
        }

        return updatedProduct;
      })
    );

    return NextResponse.json({ message: 'Ok', data: updatedProducts });
  } catch (error) {
    throw new Error(`Error in GET: ${error}`);
  }
}
