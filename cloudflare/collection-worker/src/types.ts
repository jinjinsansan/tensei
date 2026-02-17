export type CollectionCardSummary = {
  id: string;
  name: string;
  rarity: string;
  star_level?: number | null;
  description?: string | null;
  image_url?: string | null;
  max_supply?: number | null;
  current_supply?: number | null;
  person_name?: string | null;
  card_style?: string | null;
};

export type CollectionEntry = {
  id: string;
  card_id: string;
  serial_number: number | null;
  obtained_at: string;
  cards: CollectionCardSummary | null;
};

export type CollectionSnapshot = {
  collection: CollectionEntry[];
  cards: CollectionCardSummary[];
  totalOwned: number;
  distinctOwned: number;
  totalAvailable: number;
  updatedAt: string;
};

export type CollectionResponse = {
  totalOwned: number;
  distinctOwned: number;
  totalAvailable: number;
  cards: CollectionCardSummary[];
  collection: CollectionEntry[];
  page: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

export type CollectionEdgeEvent = {
  entry: CollectionEntry;
  totalOwnedDelta?: number;
  distinctOwnedDelta?: number;
};
