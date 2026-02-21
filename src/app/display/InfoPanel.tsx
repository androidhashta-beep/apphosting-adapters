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
    <div className="w-1/3 h-full flex flex-col p-4 gap-4 bg-blue-900">
        <Carousel
            className="w-full h-1/2"
            plugins={[Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })]}
            opts={{ loop: true }}
        >
            <CarouselContent>
                {infoItems.length > 0 ? infoItems.map((item) => (
                    <CarouselItem key={item.id}>
                        <Card className="h-full w-full overflow-hidden bg-slate-800 border-2 border-sky-400">
                            <CardContent className="relative h-full w-full p-0">
                                <Image
                                    src={item.imageUrl}
                                    alt={item.description}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 33vw"
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2 text-center">
                                    <p className="font-bold text-white">{item.description}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </CarouselItem>
                )) : (
                     <CarouselItem>
                         <Card className="h-full w-full overflow-hidden bg-slate-800 border-2 border-sky-400 flex items-center justify-center">
                             <CardContent className="p-0 text-center">
                                 <p className="text-muted-foreground">No informational slides.</p>
                             </CardContent>
                         </Card>
                    </CarouselItem>
                )}
            </CarouselContent>
        </Carousel>
        <div className="w-full h-1/2 flex flex-col bg-slate-800 rounded-lg border-2 border-sky-400">
            <div className="flex-grow relative">
                <Carousel
                    className="absolute inset-0"
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
                            <CarouselItem key={item.id}>
                                <Card className="h-full w-full overflow-hidden bg-slate-800 border-0 rounded-none">
                                    <CardContent className="relative h-full w-full p-0">
                                        <Image
                                            src={item.imageUrl}
                                            alt={item.description}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 100vw, 33vw"
                                        />
                                    </CardContent>
                                </Card>
                            </CarouselItem>
                        )) : (
                             <CarouselItem>
                                 <div className="h-full w-full flex items-center justify-center">
                                     <p className="text-muted-foreground">No promotional slides.</p>
                                 </div>
                            </CarouselItem>
                        )}
                    </CarouselContent>
                </Carousel>
            </div>
            <div className="p-2 bg-black/30 border-t border-sky-400 flex justify-between items-center">
                <Clock />
            </div>
        </div>
    </div>
  );
}
