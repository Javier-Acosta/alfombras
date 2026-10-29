"use client";
import { useState } from "react";
import styles from "./product-gallery.module.css";
export function ProductGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [index, setIndex] = useState(0);
  if (!images.length) return null;
  return (
    <div className={styles.gallery}>
      <img
        className={styles.main}
        src={images[index] || images[0]}
        alt={`${name}, imagen ${index + 1}`}
        loading="lazy"
      />
      {images.length > 1 && (
        <div
          className={styles.thumbnails}
          role="group"
          aria-label={`Fotos de ${name}`}
        >
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={`Ver imagen ${i + 1} de ${name}`}
              aria-pressed={index === i}
              onClick={() => setIndex(i)}
            >
              <img
                src={i === 0 ? src : `${src}?thumb=160x160`}
                alt=""
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
