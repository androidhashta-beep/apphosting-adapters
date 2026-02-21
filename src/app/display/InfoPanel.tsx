'use client';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';
import type { Settings } from '@/lib/types';
import { Clock } from './Clock';
import { Card, CardContent } from '@/components/ui/card';

export function InfoPanel({ settings }: { settings: Settings | null }) {

  const infoItems = settings?.placeholderImages?.filter(p => p.type === 'image') || [];
  const videoItems = settings?.placeholderImages?.filter(p => p.type === 'video') || [];

  return (
    <div className="w-1/2 h-full flex flex-col p-4 gap-4">
        {/* Top Part: Contains Top Carousel and Clock */}
        <div className="h-1/2 flex flex-col gap-4">
            {/* Top Image Carousel */}
            <div className="flex-1 relative">
                <Carousel
                    className="absolute inset-0 h-full w-full"
                    plugins={[Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })]}
                    opts={{ loop: true }}
                >
                    <CarouselContent className="h-full">
                        {infoItems.length > 0 ? infoItems.map((item) => (
                            <CarouselItem key={item.id} className="h-full">
                                <Card className="h-full w-full overflow-hidden bg-transparent border-none">
                                    <CardContent className="relative h-full w-full p-0">
                                        <Image
                                            src={item.imageUrl}
                                            alt={item.description}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 100vw, 50vw"
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2 text-center">
                                            <p className="font-bold text-white">{item.description}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </CarouselItem>
                        )) : (
                             <CarouselItem className="h-full">
                                 <Card className="h-full w-full overflow-hidden bg-transparent border-none flex items-center justify-center">
                                     <CardContent className="p-0 text-center">
                                         <p className="text-muted-foreground">No informational slides.</p>
                                     </CardContent>
                                 </Card>
                            </CarouselItem>
                        )}
                    </CarouselContent>
                </Carousel>
            </div>

            {/* Clock */}
            <div className="flex-shrink-0 p-2 bg-black/30 rounded-lg">
                <Clock />
            </div>
        </div>

        {/* Bottom Video Carousel */}
        <div className="h-1/2 relative rounded-lg overflow-hidden">
             <Carousel
                className="absolute inset-0 h-full w-full"
                plugins={[Autoplay({ delay: 7000, stopOnInteraction: false, stopOnMouseEnter: true })]}
                opts={{ loop: true }}
            >
                <CarouselContent className="h-full">
                    {videoItems.length > 0 ? videoItems.map((item) => (
                        <CarouselItem key={item.id} className="h-full">
                            <div className="relative h-full w-full">
                                {item.type === 'video' ? (
                                    <video src={item.imageUrl} autoPlay loop muted={!item.useOwnAudio} className="h-full w-full object-cover" />
                                ) : (
                                    <Image src={item.imageUrl} alt={item.description} fill className="object-cover" />
                                )}
                            </div>
                        </CarouselItem>
                    )) : infoItems.length > 0 ? infoItems.map((item) => (
                        <CarouselItem key={item.id} className="h-full">
                             <div className="relative h-full w-full">
                                <Image
                                    src={item.imageUrl}
                                    alt={item.description}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                />
                             </div>
                        </CarouselItem>
                    )) : (
                         <CarouselItem className="h-full">
                             <div className="h-full w-full flex items-center justify-center bg-transparent rounded-lg">
                                 <p className="text-muted-foreground">No promotional slides.</p>
                             </div>
                        </CarouselItem>
                    )}
                </CarouselContent>
            </Carousel>
        </div>
    </div>
  );
}
