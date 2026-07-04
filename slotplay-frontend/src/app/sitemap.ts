import { MetadataRoute } from 'next';
export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://slotplay.in';
  return [
    { url: base,               lastModified: new Date(), changeFrequency: 'daily',   priority: 1 },
    { url: `${base}/venues`,   lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${base}/login`,    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];
}
