import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
  type: 'image' | 'video';
  useOwnAudio?: boolean;
};

export type AudioTrack = {
    id: string;
    description: string;
    url: string;
};

export const PlaceHolderImages: ImagePlaceholder[] = data.placeholderImages as ImagePlaceholder[];
export const BackgroundMusic: AudioTrack[] = data.backgroundMusic as AudioTrack[];
