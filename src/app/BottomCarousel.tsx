"use client";

import * as React from "react";
import Image from "next/image";
import Autoplay from "embla-carousel-autoplay";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { ImagePlaceholder, PlaceHolderImages } from "@/lib/placeholder-images";

export function BottomCarousel() {
  // Filter for items that are images
  const imageItems = PlaceHolderImages.filter(p => p.type === 'image');
  const canAutoplay = imageItems.length > 1;

  const autoplayPlugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  );

  const handleMediaError = (e: React.SyntheticEvent<HTMLImageElement>) => {
      console.warn(`An image failed to load and has been hidden. Source: ${e.currentTarget.src}`);
      if (e.currentTarget.parentElement) {
        e.currentTarget.parentElement.style.display = 'none';
      }
  };

  return (
    <div className="w-full mt-12">
        <h2 className="text-2xl font-bold text-center mb-6">Our Training Facilities</h2>
        <Carousel
            plugins={canAutoplay ? [autoplayPlugin.current] : []}
            opts={{ loop: canAutoplay, align: "start" }}
            className="w-full"
        >
            <CarouselContent>
            {imageItems.length > 0 ? (imageItems as ImagePlaceholder[]).map((item) => (
                <CarouselItem key={item.id} className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-1">
                        <Card className="h-64 overflow-hidden">
                            <CardContent className="relative h-full p-0">
                                <Image
                                src={item.imageUrl}
                                alt={item.description}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover"
                                data-ai-hint={item.imageHint}
                                onError={handleMediaError}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </CarouselItem>
                )) : (
                <CarouselItem>
                    <Card className="h-64 flex items-center justify-center bg-muted">
                        <CardContent className="p-0">
                            <p className="text-muted-foreground">No images to display.</p>
                        </CardContent>
                    </Card>
                </CarouselItem>
            )}
            </CarouselContent>
        </Carousel>
    </div>
  );
}
