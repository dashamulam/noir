import { artwork } from '../lib/api';
import type { MediaLink } from '../types';

export function Artwork({ image, src, alt = '', className = '' }: { image?: MediaLink[]; src?: string; alt?: string; className?: string }) {
  return <img className={`artwork ${className}`} src={src || artwork(image)} alt={alt} loading="lazy" onError={event => {
    const target = event.currentTarget;
    if (!target.src.endsWith('/cover.svg')) target.src = '/cover.svg';
  }} />;
}
