import HeroCarousel from '@/components/HeroCarousel';
import SearchBar from '@/components/SearchBar';
import Image from 'next/image';
import React from 'react';
import { getAllProducts } from '@/lib/actions';
import ProductCard from '@/components/ProductCard';

const Home = async () => {
  const allProducts = await getAllProducts();

  return (
    <>
      <section className="px-6 md:px-20 py-24 ">
        <div className="flex max-xl:flex-col gap-16">
          <div className="flex flex-col justify-center">
            <p className="small-text">
              Find the price history of your desired product:
              <Image
                src="/assets/icons/arrow-right.svg"
                alt="arrow-right"
                height={16}
                width={16}
              />
            </p>
            <h1 className="head-text">
              Track the Product with
              <span className="text-primary"> PriceTracker</span>
            </h1>
            <p className="mt-6">
              This is a powerful tool that lets you input a product url from
              Amazon and find its price history.
            </p>
            <SearchBar />
          </div>
          <HeroCarousel />
        </div>
      </section>

      <section className="trending-section">
        <h2 className="section-text">Trending</h2>
        <div className="flex flex-wrap gap-x-8 gap-y-16">
          {allProducts?.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>
    </>
  );
};

export default Home;
