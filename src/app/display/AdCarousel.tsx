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
import { PlaceHolderImages } from "@/lib/placeholder-images";

export function AdCarousel() {
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  const adImages = PlaceHolderImages.filter(p => p.id.startsWith('ad-display-'));

  return (
    <Carousel
      plugins={[plugin.current]}
      className="w-full h-full"
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
    >
      <CarouselContent className="h-full">
        {adImages.length > 0 ? adImages.map((image) => (
          <CarouselItem key={image.id} className="h-full">
            <Card className="h-full overflow-hidden">
              <CardContent className="relative h-full p-0">
                <Image
                  src={image.imageUrl}
                  alt={image.description}
                  fill
                  sizes="100%"
                  className="object-cover"
                  data-ai-hint={image.imageHint}
                />
              </CardContent>
            </Card>
          </CarouselItem>
        )) : (
            <CarouselItem>
                <Card className="h-full flex items-center justify-center bg-muted">
                    <CardContent className="p-0">
                        <p className="text-muted-foreground">No advertisements to display.</p>
                    </CardContent>
                </Card>
            </CarouselItem>
        )}
      </CarouselContent>
    </Carousel>
  );
}
