type LibraryDividerProps = {
  label?: string;
};

export function LibraryDivider({ label }: LibraryDividerProps) {
  return (
    <div className="library-divider" aria-hidden>
      {label ? `─── ${label} ───` : '─── ✦ ───'}
    </div>
  );
}
