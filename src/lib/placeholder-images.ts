import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
  type: 'image' | 'video';
};

export const PlaceHolderImages: ImagePlaceholder[] = data.placeholderImages as ImagePlaceholder[];
