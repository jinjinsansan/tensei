import { CollectionGallery } from '@/components/collection/collection-gallery';

export default function CollectionPage() {
  return (
    <section className="space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">Card Collection</p>
        <h1 className="font-display text-4xl text-white">転生カード図鑑</h1>
        <p className="text-sm text-white/70">尊師ガチャと同じ導線でカードを閲覧できます。</p>
      </div>
      <CollectionGallery />
    </section>
  );
}
