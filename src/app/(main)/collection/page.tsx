import { CollectionGallery } from '@/components/collection/collection-gallery';

export default function CollectionPage() {
  return (
    <section className="space-y-6 text-primary">
      <div className="space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.45em] text-accent">Archive Shelf</p>
        <h1 className="text-3xl font-bold">書架</h1>
        <p className="text-sm text-secondary">収集した物語の書を背表紙で眺められます。色はレア度を表しています。</p>
      </div>
      <CollectionGallery />
    </section>
  );
}
