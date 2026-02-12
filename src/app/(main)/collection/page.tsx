import { CollectionGallery } from '@/components/collection/collection-gallery';

export default function CollectionPage() {
  return (
    <section className="space-y-6 text-library-text-primary">
      <div className="space-y-2 text-center">
        <p className="font-accent text-xs uppercase tracking-[0.45em] text-library-accent">Archive Shelf</p>
        <h1 className="font-serif text-3xl">書架</h1>
        <p className="text-sm text-library-text-secondary">収集した物語の書を背表紙で眺められます。色はレア度を表しています。</p>
      </div>
      <CollectionGallery />
    </section>
  );
}
