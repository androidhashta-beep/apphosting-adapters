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

export function AdCarousel() {
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  const adItems = PlaceHolderImages.filter(p => p.id.startsWith('ad-display-'));

  return (
    <Carousel
      plugins={[plugin.current]}
      className="w-full h-full"
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
    >
      <CarouselContent className="h-full">
        {adItems.length > 0 ? (adItems as ImagePlaceholder[]).map((item) => {
          const isVideo = item.type === 'video';

          return (
            <CarouselItem key={item.id} className="h-full">
              <Card className="h-full overflow-hidden">
                <CardContent className="relative h-full p-0">
                  {isVideo ? (
                    <video
                      src={item.imageUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                      data-ai-hint={item.imageHint}
                    >
                        Your browser does not support the video tag.
                    </video>
                  ) : (
                    <Image
                      src={item.imageUrl}
                      alt={item.description}
                      fill
                      sizes="100%"
                      className="object-cover"
                      data-ai-hint={item.imageHint}
                    />
                  )}
                </CardContent>
              </Card>
            </CarouselItem>
          )
        }) : (
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
