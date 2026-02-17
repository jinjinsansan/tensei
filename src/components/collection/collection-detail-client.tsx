"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useSignedAssetResolver } from "@/lib/gacha/client-assets";

type Friend = {
  id: string;
  display_name: string | null;
  email: string | null;
};

type DetailEntry = {
  id: string;
  cardId: string;
  cardName: string;
  rarity: string;
  starLevel: number | null;
  description: string | null;
  serialNumber: number | null;
  obtainedAt: string | null;
  imageUrl: string | null;
  personName: string | null;
  cardStyle: string | null;
};

type Props = {
  entry: DetailEntry;
  shareUrl: string;
};

const FALLBACK_CARD_IMAGE = "/placeholders/card-default.svg";

const RARITY_BADGES: Record<string, string> = {
  N: "text-white/80 border-white/30 bg-white/5",
  R: "text-amber-200 border-amber-200/50 bg-amber-500/10",
  SR: "text-rose-200 border-rose-300/40 bg-rose-500/10",
  SSR: "text-fuchsia-200 border-fuchsia-300/40 bg-fuchsia-600/10",
  UR: "text-emerald-200 border-emerald-300/40 bg-emerald-500/10",
  LR: "text-cyan-200 border-cyan-300/40 bg-cyan-600/10",
};

export function CollectionDetailClient({ entry, shareUrl }: Props) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState("");
  const [sendState, setSendState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [sendMessage, setSendMessage] = useState<string | null>(null);
  const [downloadState, setDownloadState] = useState<"idle" | "pending" | "error">("idle");

  const sources = useMemo(() => (entry.imageUrl ? [entry.imageUrl] : []), [entry.imageUrl]);
  const { resolveAssetSrc, isSigning } = useSignedAssetResolver(sources);
  const resolvedImage = resolveAssetSrc(entry.imageUrl) ?? entry.imageUrl ?? FALLBACK_CARD_IMAGE;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/social/friends/list");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setFriends(data.friends ?? []);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const formattedSerial = entry.serialNumber != null ? `#${String(entry.serialNumber).padStart(3, "0")}` : "---";
  const formattedObtainedAt = useMemo(() => {
    if (!entry.obtainedAt) return "---";
    try {
      return new Date(entry.obtainedAt).toLocaleString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return entry.obtainedAt;
    }
  }, [entry.obtainedAt]);

  const stars = useMemo(() => {
    if (!entry.starLevel || entry.starLevel <= 0) return null;
    const count = Math.min(12, Math.max(1, entry.starLevel));
    return "★".repeat(count);
  }, [entry.starLevel]);

  const rarityBadge = RARITY_BADGES[entry.rarity] ?? RARITY_BADGES.N;

  const shareIntentUrl = useMemo(() => {
    const text = encodeURIComponent(`「${entry.cardName}」を獲得しました！`);
    const url = encodeURIComponent(shareUrl);
    return `https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=%E6%9D%A5%E4%B8%96%E3%82%AC%E3%83%81%E3%83%A3`;
  }, [entry.cardName, shareUrl]);

  const handleSendToFriend = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!selectedFriend) return;
      setSendState("loading");
      setSendMessage(null);
      try {
        const res = await fetch("/api/social/cards/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cardInventoryId: entry.id, toUserId: selectedFriend }),
        });
        const data = await res.json();
        if (!res.ok) {
          setSendState("error");
          setSendMessage(data.error ?? "カード送付に失敗しました");
        } else {
          setSendState("success");
          setSendMessage("カードを送付しました");
          setSelectedFriend("");
        }
      } catch {
        setSendState("error");
        setSendMessage("カード送付に失敗しました");
      }
    },
    [entry.id, selectedFriend],
  );

  const handleDownload = useCallback(async () => {
    if (!resolvedImage) return;
    setDownloadState("pending");
    
    try {
      // 署名付きURL（R2）の場合は画像合成をスキップして元画像をダウンロード
      // R2はCORSヘッダーを返さないため、Canvasで操作するとtaintedエラーが発生する
      const isSignedUrl = resolvedImage.includes('r2.cloudflarestorage.com') || 
                          resolvedImage.includes('X-Amz-Signature');
      
      if (isSignedUrl) {
        // 署名付きURLの場合は元画像をそのままダウンロード
        const response = await fetch(resolvedImage);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        // モバイルデバイスの判定（タッチスクリーンと画面幅で判定）
        const isMobile = ('ontouchstart' in window || navigator.maxTouchPoints > 0) && 
                         window.innerWidth <= 768;
        
        if (isMobile && navigator.share && navigator.canShare) {
          const file = new File([blob], `${entry.cardName || "card"}.png`, { type: "image/png" });
          if (navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                title: entry.cardName,
                text: `${entry.cardName}を獲得しました！`,
                files: [file],
              });
              setDownloadState("idle");
              return;
            } catch {
              // ユーザーがキャンセルした場合などは通常ダウンロードにフォールバック
              console.log("Share cancelled or failed, falling back to download");
            }
          }
        }
        
        const link = document.createElement("a");
        link.href = url;
        link.download = `${entry.cardName || "card"}.png`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        setDownloadState("idle");
        return;
      }

      // Canvas で画像合成（publicフォルダ内の画像のみ）
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Canvas not supported");
      }

      // 画像を読み込み
      const img = new window.Image();
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Image load failed"));
        img.src = resolvedImage;
      });

      // Canvas サイズを設定（画像サイズに合わせる）
      canvas.width = img.width;
      canvas.height = img.height;

      // 背景画像を描画
      ctx.drawImage(img, 0, 0);

      const borderWidth = Math.max(4, Math.floor(img.width * 0.012));
      const padding = Math.max(12, Math.floor(img.width / 28));
      const innerWidth = img.width - borderWidth * 2;

      // 外枠
      ctx.lineWidth = borderWidth;
      const frameGradient = ctx.createLinearGradient(0, 0, img.width, img.height);
      frameGradient.addColorStop(0, "rgba(255,215,128,0.9)");
      frameGradient.addColorStop(0.5, "rgba(168,134,255,0.8)");
      frameGradient.addColorStop(1, "rgba(255,249,198,0.9)");
      ctx.strokeStyle = frameGradient;
      ctx.strokeRect(borderWidth / 2, borderWidth / 2, img.width - borderWidth, img.height - borderWidth);

      // 上部ヘッダー
      const headerHeight = Math.floor(img.height * 0.12);
      const headerGradient = ctx.createLinearGradient(borderWidth, borderWidth, borderWidth, borderWidth + headerHeight);
      headerGradient.addColorStop(0, "rgba(20,20,25,0.95)");
      headerGradient.addColorStop(1, "rgba(10,10,15,0.8)");
      ctx.fillStyle = headerGradient;
      ctx.fillRect(borderWidth, borderWidth, innerWidth, headerHeight);

      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fillRect(borderWidth, borderWidth + headerHeight - 2, innerWidth, 2);

      const headerFont = Math.floor(headerHeight * 0.45);
      ctx.font = `600 ${headerFont}px 'Inter', 'Noto Sans JP', sans-serif`;
      ctx.fillStyle = "#fcd34d";
      ctx.fillText(entry.rarity, borderWidth + padding, borderWidth + headerHeight - headerFont * 0.4);

      if (stars) {
        const starFont = Math.floor(headerFont * 0.9);
        ctx.font = `700 ${starFont}px 'Inter', sans-serif`;
        ctx.fillStyle = "#fde68a";
        const starWidth = ctx.measureText(stars).width;
        ctx.fillText(stars, img.width - padding - starWidth, borderWidth + headerHeight - headerFont * 0.4);
      }

      // 下部フッター
      const footerHeight = Math.floor(img.height * 0.3);
      const footerY = img.height - footerHeight - borderWidth;
      const footerGradient = ctx.createLinearGradient(0, footerY, 0, footerY + footerHeight);
      footerGradient.addColorStop(0, "rgba(0,0,0,0.02)");
      footerGradient.addColorStop(0.35, "rgba(0,0,0,0.6)");
      footerGradient.addColorStop(1, "rgba(0,0,0,0.95)");
      ctx.fillStyle = footerGradient;
      ctx.fillRect(borderWidth, footerY, innerWidth, footerHeight);

      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fillRect(borderWidth, footerY, innerWidth, 2);

      // タイトル
      const titleFont = Math.floor(img.width / 18);
      ctx.font = `700 ${titleFont}px 'Noto Sans JP', 'Inter', sans-serif`;
      ctx.fillStyle = "#ffffff";
      const titleY = footerY + padding + titleFont;
      ctx.fillText(entry.cardName, borderWidth + padding, titleY);

      // 説明テキスト折り返し
      const bodyFont = Math.floor(titleFont * 0.55);
      const lineHeight = bodyFont * 1.5;
      const maxWidth = innerWidth - padding * 2;
      const maxLines = 3;
      const drawWrappedText = (text: string, startY: number) => {
        ctx.font = `${bodyFont}px 'Noto Sans JP', 'Inter', sans-serif`;
        ctx.fillStyle = "#e5e5e5";
        const chars = text.split("");
        let line = "";
        let y = startY;
        let lineCount = 0;
        for (let i = 0; i < chars.length; i++) {
          const testLine = line + chars[i];
          if (ctx.measureText(testLine).width > maxWidth && line !== "") {
            ctx.fillText(line, borderWidth + padding, y);
            line = chars[i];
            y += lineHeight;
            lineCount++;
            if (lineCount >= maxLines - 1) {
              ctx.fillText(`${line}${i < chars.length - 1 ? "..." : ""}`, borderWidth + padding, y);
              return y + lineHeight;
            }
          } else {
            line = testLine;
          }
        }
        if (line) {
          ctx.fillText(line, borderWidth + padding, y);
          y += lineHeight;
        }
        return y;
      };

      if (entry.description) {
        drawWrappedText(entry.description, titleY + padding);
      }

      // シリアル番号（カード番号風）
      const serialFont = Math.floor(titleFont * 0.6);
      ctx.font = `700 ${serialFont}px 'Inter', sans-serif`;
      ctx.fillStyle = "#c4b5fd";
      const serialWidth = ctx.measureText(formattedSerial).width;
      ctx.fillText(formattedSerial, img.width - padding - serialWidth, footerY + footerHeight - padding);

      // 人名・スタイルなどラベル
      const metaFont = Math.floor(bodyFont * 0.75);
      ctx.font = `600 ${metaFont}px 'Inter', sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      const metaTexts = [entry.personName, entry.cardStyle].filter(Boolean) as string[];
      if (metaTexts.length > 0) {
        let metaX = borderWidth + padding;
        const metaY = footerY + footerHeight - padding - serialFont - Math.floor(metaFont * 1.4);
        for (const text of metaTexts) {
          const label = `● ${text}`;
          const width = ctx.measureText(label).width + padding;
          ctx.fillText(label, metaX, metaY);
          metaX += width;
        }
      }

      // Canvas を Blob に変換
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error("Failed to create blob"));
        }, "image/png");
      });

      // モバイルデバイスの判定
      const isMobile = ('ontouchstart' in window || navigator.maxTouchPoints > 0) && 
                       window.innerWidth <= 768;
      
      // Web Share API が使える場合（主にモバイル）
      if (isMobile && navigator.share && navigator.canShare) {
        const file = new File([blob], `${entry.cardName || "card"}.png`, { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: entry.cardName,
              text: `${entry.cardName}を獲得しました！`,
              files: [file],
            });
            setDownloadState("idle");
            return;
          } catch {
            // ユーザーがキャンセルした場合などは通常ダウンロードにフォールバック
            console.log("Share cancelled or failed, falling back to download");
          }
        }
      }

      // 通常のダウンロード
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${entry.cardName || "card"}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setDownloadState("idle");
    } catch (error) {
      console.error("Download failed:", error);
      if (error instanceof DOMException && error.name === 'SecurityError') {
        console.error("CORS security error - image may be from a different origin");
      }
      setDownloadState("error");
    }
  }, [
    entry.cardName,
    entry.rarity,
    entry.description,
    entry.personName,
    entry.cardStyle,
    resolvedImage,
    stars,
    formattedSerial,
  ]);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4 rounded-3xl border border-white/10 bg-black/40 p-6 shadow-panel-inset">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.45em] text-neon-purple">CARD SHOWCASE</p>
            <h1 className="font-display text-3xl text-white">{entry.cardName}</h1>
            {entry.description && <p className="text-sm text-white/80">{entry.description}</p>}
          </div>
          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-white/10 via-white/0 to-white/0 p-4 shadow-[0_25px_80px_rgba(0,0,0,0.55)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_60%)]" />
            <div className="relative aspect-[3/4] w-full">
              <Image
                src={resolvedImage}
                alt={entry.cardName}
                fill
                sizes="(max-width: 768px) 100vw, 60vw"
                className="rounded-[26px] object-cover"
                priority
                onError={(event) => {
                  if (event.currentTarget.src !== FALLBACK_CARD_IMAGE) {
                    event.currentTarget.src = FALLBACK_CARD_IMAGE;
                  }
                }}
              />
            </div>
            {isSigning && (
              <p className="mt-3 text-center text-[0.65rem] uppercase tracking-[0.35em] text-white/60">
                署名付きURLを生成中...
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.35em] text-white/70">
            <span className={`rounded-full border px-4 py-1 ${rarityBadge}`}>{entry.rarity}</span>
            {stars && <span className="rounded-full border border-white/15 px-4 py-1 text-amber-200">{stars}</span>}
            <span className="rounded-full border border-white/15 px-4 py-1">{formattedSerial}</span>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-white/10 bg-black/35 p-6 shadow-panel-inset">
            <p className="text-xs uppercase tracking-[0.4em] text-neon-yellow">OBTAIN DATA</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.35em] text-white/60">Serial</p>
                <p className="text-2xl font-display text-white">{formattedSerial}</p>
              </div>
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.35em] text-white/60">獲得日時</p>
                <p className="text-lg text-white">{formattedObtainedAt}</p>
              </div>
            </div>
            {(entry.personName || entry.cardStyle) && (
              <div className="mt-4 flex flex-wrap gap-2 text-[0.7rem] uppercase tracking-[0.3em] text-white/70">
                {entry.personName && (
                  <span className="rounded-full border border-white/15 px-3 py-1">{entry.personName}</span>
                )}
                {entry.cardStyle && (
                  <span className="rounded-full border border-white/15 px-3 py-1">{entry.cardStyle}</span>
                )}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/35 p-6 shadow-panel-inset">
            <p className="text-xs uppercase tracking-[0.4em] text-neon-blue">SHARE</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={shareIntentUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex flex-1 items-center justify-center rounded-full border border-white/15 px-4 py-2 text-[0.75rem] font-semibold uppercase tracking-[0.35em] text-white transition hover:border-white/40"
              >
                Xでシェア
              </a>
              <button
                type="button"
                onClick={handleDownload}
                disabled={!resolvedImage || downloadState === "pending"}
                className="inline-flex flex-1 items-center justify-center rounded-full border border-white/15 px-4 py-2 text-[0.75rem] font-semibold uppercase tracking-[0.35em] text-white transition hover:border-white/40 disabled:opacity-40"
              >
                {downloadState === "pending" ? "DOWNLOADING" : "ダウンロード"}
              </button>
            </div>
            {downloadState === "error" && (
              <p className="mt-2 text-xs text-red-300">ダウンロードを開始できませんでした。もう一度お試しください。</p>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/35 p-6 shadow-panel-inset">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-neon-green">FRIEND DELIVERY</p>
                <p className="text-sm text-white/80">フレンドにカードをプレゼントできます。</p>
              </div>
              <Link
                href="/social"
                className="text-[0.65rem] uppercase tracking-[0.35em] text-neon-blue underline-offset-4 hover:underline"
              >
                フレンド管理へ
              </Link>
            </div>
            {friends.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-3 text-sm text-white/70">
                送付できるフレンドがまだいません。まずはソーシャルページでフレンド登録してください。
              </p>
            ) : (
              <form onSubmit={handleSendToFriend} className="mt-4 space-y-3">
                <label className="space-y-2 text-sm text-white">
                  <span className="text-[0.6rem] uppercase tracking-[0.35em] text-white/60">Friend</span>
                  <select
                    value={selectedFriend}
                    onChange={(event) => setSelectedFriend(event.target.value)}
                    className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white focus:border-neon-blue focus:outline-none"
                  >
                    <option value="">選択してください</option>
                    {friends.map((friend) => (
                      <option key={friend.id} value={friend.id}>
                        {friend.display_name ?? friend.email ?? friend.id}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="submit"
                  disabled={!selectedFriend || sendState === "loading"}
                  className="w-full rounded-full border border-white/15 bg-gradient-to-r from-[#32f0c9]/30 via-[#7bf1ff]/25 to-[#fbc2eb]/30 px-4 py-2 text-[0.75rem] font-semibold uppercase tracking-[0.35em] text-white transition hover:border-white/40 disabled:opacity-40"
                >
                  {sendState === "loading" ? "送信中..." : "フレンドに送る"}
                </button>
                {sendMessage && (
                  <p
                    className={`text-sm ${sendState === "error" ? "text-red-300" : "text-white/80"}`}
                  >
                    {sendMessage}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
