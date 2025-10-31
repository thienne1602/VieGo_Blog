"use client";

import Link from "next/link";
import Image from "next/image";

type Props = { tour: any };

export default function TourCard({ tour }: Props) {
  const image =
    tour.featured_image ||
    (tour.gallery_images && tour.gallery_images[0]) ||
    "/images/tours/default.jpg";

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: tour.currency || "VND",
    }).format(price);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group">
      <Link href={`/tours/${tour.id}`} className="block">
        <div className="relative h-52 w-full bg-gray-100">
          {/* Use Image if available */}
          {image ? (
            // next/image requires width/height; using fill layout
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={tour.title}
              className="object-cover w-full h-52"
            />
          ) : null}

          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent z-10" />

          <div className="absolute top-3 left-3 z-20">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
              {tour.difficulty_level || tour.difficulty || "--"}
            </span>
          </div>

          <div className="absolute top-3 right-3 z-20 bg-white/90 px-2 py-1 rounded-full text-sm font-medium">
            ⭐ {tour.rating || "-"} ({tour.reviews_count || 0})
          </div>

          <div className="absolute bottom-3 left-3 z-20 bg-black/70 text-white px-2 py-1 rounded text-xs">
            {tour.duration_days || tour.duration || "-"} ngày
          </div>
        </div>

        <div className="p-5">
          <h3 className="font-bold text-lg mb-2 text-neutral-800 group-hover:text-primary transition-colors">
            {tour.title}
          </h3>

          <p className="text-neutral-600 mb-4 line-clamp-2 text-sm leading-relaxed">
            {tour.description}
          </p>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-bold text-primary">
                {formatPrice(tour.price_per_person || tour.price)}
              </div>
              <div className="text-xs text-neutral-500">
                /người · Tối đa {tour.max_participants || 10} người
              </div>
            </div>

            <div className="flex flex-col items-end space-y-2">
              <Link
                href={`/tours/${tour.id}`}
                className="px-4 py-2 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-all duration-300 text-sm"
              >
                Chi Tiết
              </Link>
              <button className="px-4 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-lg text-sm">
                Đặt Ngay
              </button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
