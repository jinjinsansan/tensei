"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { Check, ChevronDown } from "lucide-react";

import { useSignedAssetResolver } from "@/lib/gacha/client-assets";
import { buildCommonAssetPath } from "@/lib/gacha/assets";

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
  isLossCard: boolean;
};

type Props = {
  entry: DetailEntry;
  shareUrl: string;
  referralShareActive?: boolean;
};

const FALLBACK_CARD_IMAGE = "/placeholders/card-default.svg";
const LOSS_CARD_IMAGE = buildCommonAssetPath("loss_card.png");

function pickDisplayImage(entry: DetailEntry, resolvedAsset?: string | null) {
  if (resolvedAsset) return resolvedAsset;
  if (entry.imageUrl) return entry.imageUrl;
  if (entry.isLossCard) return LOSS_CARD_IMAGE;
  return FALLBACK_CARD_IMAGE;
}

const RARITY_BADGES: Record<string, string> = {
  N: "text-white/80 border-white/30 bg-white/5",
  R: "text-amber-200 border-amber-200/50 bg-amber-500/10",
  SR: "text-rose-200 border-rose-300/40 bg-rose-500/10",
  SSR: "text-fuchsia-200 border-fuchsia-300/40 bg-fuchsia-600/10",
  UR: "text-emerald-200 border-emerald-300/40 bg-emerald-500/10",
  LR: "text-cyan-200 border-cyan-300/40 bg-cyan-600/10",
};

type CardTheme = {
  frameOuter: [string, string];
  frameInner: [string, string];
  headerBg: string;
  headerText: string;
  panelBg: string;
  panelBorder: string;
  starColor: string;
  starGlow: string;
  serialColor: string;
  tagBg: string;
  tagText: string;
  accent: string;
};

const DEFAULT_CARD_THEME: CardTheme = {
  frameOuter: ["#fefefe", "#d1d5db"],
  frameInner: ["#cbd5f5", "#f5f3ff"],
  headerBg: "rgba(8,8,15,0.94)",
  headerText: "#f9fafb",
  panelBg: "rgba(6,6,10,0.92)",
  panelBorder: "rgba(255,255,255,0.15)",
  starColor: "#fde047",
  starGlow: "rgba(250,204,21,0.4)",
  serialColor: "#c4b5fd",
  tagBg: "rgba(255,255,255,0.08)",
  tagText: "#e2e8f0",
  accent: "#93c5fd",
};

const CARD_THEMES: Record<string, CardTheme> = {
  N: {
    frameOuter: ["#9ca3af", "#6b7280"],
    frameInner: ["#d1d5db", "#f3f4f6"],
    headerBg: "rgba(15,15,18,0.95)",
    headerText: "#f5f5f5",
    panelBg: "rgba(9,9,12,0.94)",
    panelBorder: "rgba(255,255,255,0.12)",
    starColor: "#fbbf24",
    starGlow: "rgba(251,191,36,0.35)",
    serialColor: "#d1d5db",
    tagBg: "rgba(255,255,255,0.08)",
    tagText: "#f3f4f6",
    accent: "#a5b4fc",
  },
  R: {
    frameOuter: ["#fcd34d", "#fb923c"],
    frameInner: ["#fff7d6", "#fde68a"],
    headerBg: "rgba(28,14,6,0.95)",
    headerText: "#fff7d4",
    panelBg: "rgba(20,10,6,0.94)",
    panelBorder: "rgba(250,204,21,0.35)",
    starColor: "#fde68a",
    starGlow: "rgba(253,230,138,0.45)",
    serialColor: "#fb923c",
    tagBg: "rgba(250,204,21,0.15)",
    tagText: "#fff7d4",
    accent: "#f97316",
  },
  SR: {
    frameOuter: ["#f9a8d4", "#fef08a"],
    frameInner: ["#fff1e1", "#ffd5f0"],
    headerBg: "rgba(32,13,24,0.95)",
    headerText: "#fff5f7",
    panelBg: "rgba(21,6,14,0.94)",
    panelBorder: "rgba(249,168,212,0.4)",
    starColor: "#fef9c3",
    starGlow: "rgba(252,211,77,0.45)",
    serialColor: "#f472b6",
    tagBg: "rgba(249,168,212,0.18)",
    tagText: "#ffe4f1",
    accent: "#fb7185",
  },
  SSR: {
    frameOuter: ["#c084fc", "#f472b6"],
    frameInner: ["#fdf4ff", "#e9d5ff"],
    headerBg: "rgba(32,12,39,0.95)",
    headerText: "#fdf2ff",
    panelBg: "rgba(18,6,24,0.93)",
    panelBorder: "rgba(192,132,252,0.5)",
    starColor: "#fef3c7",
    starGlow: "rgba(254,215,170,0.45)",
    serialColor: "#c084fc",
    tagBg: "rgba(192,132,252,0.2)",
    tagText: "#f5e9ff",
    accent: "#f472b6",
  },
  UR: {
    frameOuter: ["#34d399", "#60a5fa"],
    frameInner: ["#d1fae5", "#e0f2fe"],
    headerBg: "rgba(6,24,28,0.95)",
    headerText: "#e0f2fe",
    panelBg: "rgba(3,12,17,0.93)",
    panelBorder: "rgba(103,232,249,0.45)",
    starColor: "#a7f3d0",
    starGlow: "rgba(5,150,105,0.4)",
    serialColor: "#67e8f9",
    tagBg: "rgba(45,212,191,0.16)",
    tagText: "#ccfbf1",
    accent: "#5eead4",
  },
  LR: {
    frameOuter: ["#fde047", "#f97316"],
    frameInner: ["#fff8dc", "#fff1a6"],
    headerBg: "rgba(36,24,5,0.96)",
    headerText: "#fff7d6",
    panelBg: "rgba(25,15,4,0.94)",
    panelBorder: "rgba(253,224,71,0.55)",
    starColor: "#ffe08a",
    starGlow: "rgba(253,186,116,0.45)",
    serialColor: "#fb923c",
    tagBg: "rgba(253,224,71,0.2)",
    tagText: "#fff8dc",
    accent: "#fbbf24",
  },
};

const CARD_LOGO_SRC = "/raise-gacha-logo.png";

export function CollectionDetailClient({ entry, shareUrl, referralShareActive = false }: Props) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState("");
  const [sendState, setSendState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [sendMessage, setSendMessage] = useState<string | null>(null);
  const [downloadState, setDownloadState] = useState<"idle" | "pending" | "error">("idle");

  const sources = useMemo(() => (entry.imageUrl ? [entry.imageUrl] : []), [entry.imageUrl]);
  const { resolveAssetSrc, isSigning } = useSignedAssetResolver(sources);
  const resolvedAsset = resolveAssetSrc(entry.imageUrl);
  const resolvedImage = pickDisplayImage(entry, resolvedAsset);

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

  const displayDescription = useMemo(
    () => entry.description ?? (entry.isLossCard ? "この来世は見つかりませんでした..." : null),
    [entry.description, entry.isLossCard],
  );

  const stars = useMemo(() => {
    if (entry.isLossCard) return null;
    if (!entry.starLevel || entry.starLevel <= 0) return null;
    const count = Math.min(12, Math.max(1, entry.starLevel));
    return "★".repeat(count);
  }, [entry.isLossCard, entry.starLevel]);

  const rarityBadge = RARITY_BADGES[entry.rarity] ?? RARITY_BADGES.N;

  const shareIntentUrl = useMemo(() => {
    const headline = entry.isLossCard
      ? "転生失敗...魂はまだ準備中。"
      : `「${entry.cardName}」を獲得しました！`;
    const text = encodeURIComponent(headline);
    const url = encodeURIComponent(shareUrl);
    return `https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=%E6%9D%A5%E4%B8%96%E3%82%AC%E3%83%81%E3%83%A3`;
  }, [entry.cardName, entry.isLossCard, shareUrl]);

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
    const shareMessage = entry.isLossCard ? "転生失敗...魂はまだ準備中。" : `${entry.cardName}を獲得しました！`;
    
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
                text: shareMessage,
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
      const loadImageElement = (src: string) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new window.Image();
          image.onload = () => resolve(image);
          image.onerror = () => reject(new Error("Image load failed"));
          image.src = src;
        });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Canvas not supported");
      }

      const img = await loadImageElement(resolvedImage);
      const logoImage = await loadImageElement(CARD_LOGO_SRC).catch(() => null);
      const theme = CARD_THEMES[entry.rarity] ?? DEFAULT_CARD_THEME;

      const drawRoundedRect = (
        context: CanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number,
      ) => {
        const r = Math.min(radius, width / 2, height / 2);
        context.beginPath();
        context.moveTo(x + r, y);
        context.lineTo(x + width - r, y);
        context.quadraticCurveTo(x + width, y, x + width, y + r);
        context.lineTo(x + width, y + height - r);
        context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
        context.lineTo(x + r, y + height);
        context.quadraticCurveTo(x, y + height, x, y + height - r);
        context.lineTo(x, y + r);
        context.quadraticCurveTo(x, y, x + r, y);
        context.closePath();
      };

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const borderWidth = Math.max(6, Math.floor(img.width * 0.018));
      const innerWidth = img.width - borderWidth * 2;
      const padding = Math.max(14, Math.floor(img.width / 26));

      const outerBorder = Math.max(borderWidth, Math.floor(img.width * 0.02));
      ctx.lineWidth = outerBorder;
      const outerGradient = ctx.createLinearGradient(0, 0, img.width, img.height);
      outerGradient.addColorStop(0, theme.frameOuter[0]);
      outerGradient.addColorStop(1, theme.frameOuter[1]);
      ctx.strokeStyle = outerGradient;
      ctx.strokeRect(outerBorder / 2, outerBorder / 2, img.width - outerBorder, img.height - outerBorder);

      const innerBorder = Math.max(2, Math.floor(outerBorder * 0.45));
      ctx.lineWidth = innerBorder;
      const innerGradient = ctx.createLinearGradient(0, img.height, img.width, 0);
      innerGradient.addColorStop(0, theme.frameInner[0]);
      innerGradient.addColorStop(1, theme.frameInner[1]);
      ctx.strokeStyle = innerGradient;
      ctx.strokeRect(borderWidth, borderWidth, innerWidth, img.height - borderWidth * 2);

      const headerHeight = Math.floor(img.height * 0.16);
      const footerHeight = Math.floor(img.height * 0.34);
      const headerPadding = Math.max(padding, Math.floor(headerHeight * 0.25));
      const infoPaddingX = Math.max(padding * 1.3, 32);
      const infoPaddingY = Math.max(Math.floor(footerHeight * 0.12), 28);

      ctx.save();
      ctx.fillStyle = theme.headerBg;
      ctx.fillRect(borderWidth, borderWidth, innerWidth, headerHeight);
      ctx.restore();
      ctx.fillStyle = theme.accent;
      ctx.fillRect(borderWidth, borderWidth + headerHeight - 3, innerWidth, 3);

      const headerFont = Math.floor(headerHeight * 0.45);
      const headerCenterY = borderWidth + headerHeight / 2;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.font = `700 ${headerFont}px 'Inter', 'Noto Sans JP', sans-serif`;
      ctx.fillStyle = theme.headerText;
      ctx.fillText(entry.rarity, borderWidth + headerPadding, headerCenterY);

      if (logoImage) {
        const logoMaxHeight = headerHeight * 0.6;
        const ratio = logoImage.width / logoImage.height;
        const logoWidth = logoMaxHeight * ratio;
        const logoX = img.width - borderWidth - headerPadding - logoWidth;
        const logoY = headerCenterY - logoMaxHeight / 2;
        ctx.globalAlpha = 0.9;
        ctx.drawImage(logoImage, logoX, logoY, logoWidth, logoMaxHeight);
        ctx.globalAlpha = 1;
      } else {
        ctx.textAlign = "right";
        ctx.font = `700 ${Math.floor(headerFont * 0.55)}px 'Inter', sans-serif`;
        ctx.fillText("RAISE GACHA", img.width - borderWidth - headerPadding, headerCenterY);
        ctx.textAlign = "left";
      }

      const panelY = img.height - borderWidth - footerHeight;
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.55)";
      ctx.shadowBlur = Math.max(20, Math.floor(img.width * 0.02));
      ctx.fillStyle = theme.panelBg;
      ctx.fillRect(borderWidth, panelY, innerWidth, footerHeight);
      ctx.restore();
      ctx.lineWidth = 2;
      ctx.strokeStyle = theme.panelBorder;
      ctx.strokeRect(borderWidth, panelY, innerWidth, footerHeight);

      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(borderWidth, panelY + infoPaddingY * 0.35, innerWidth, 1);

      const starLabelFont = Math.max(12, Math.floor(img.width / 90));
      const starFont = Math.max(18, Math.floor(img.width / 20));
      let cursorY = panelY + infoPaddingY + starLabelFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.font = `600 ${starLabelFont}px 'Inter', sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.fillText("STAR RATING", img.width / 2, cursorY);
      cursorY += starLabelFont + Math.floor(starLabelFont * 0.5);
      ctx.font = `700 ${starFont}px 'Inter', sans-serif`;
      ctx.fillStyle = theme.starColor;
      ctx.shadowColor = theme.starGlow;
      ctx.shadowBlur = Math.max(8, Math.floor(starFont * 0.35));
      ctx.fillText(stars ?? "—", img.width / 2, cursorY);
      ctx.shadowColor = "transparent";
      ctx.textAlign = "left";
      cursorY += Math.floor(starFont * 0.7);

      const titleFont = Math.floor(img.width / 16);
      ctx.font = `700 ${titleFont}px 'Noto Sans JP', 'Inter', sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.fillText(entry.cardName, borderWidth + infoPaddingX, cursorY);
      cursorY += Math.floor(titleFont * 0.6);

      const bodyFont = Math.floor(titleFont * 0.52);
      const lineHeight = bodyFont * 1.5;
      const maxWidth = innerWidth - infoPaddingX * 2;
      const maxLines = 3;
      const drawWrappedText = (text: string, startY: number) => {
        ctx.font = `${bodyFont}px 'Noto Sans JP', 'Inter', sans-serif`;
        ctx.fillStyle = "#f5f5f5";
        const chars = text.split("");
        let line = "";
        let y = startY;
        let lineCount = 0;
        for (let i = 0; i < chars.length; i += 1) {
          const testLine = line + chars[i];
          if (ctx.measureText(testLine).width > maxWidth && line !== "") {
            ctx.fillText(line, borderWidth + infoPaddingX, y);
            line = chars[i];
            y += lineHeight;
            lineCount += 1;
            if (lineCount >= maxLines - 1) {
              ctx.fillText(`${line}${i < chars.length - 1 ? "..." : ""}`, borderWidth + infoPaddingX, y);
              return y + lineHeight;
            }
          } else {
            line = testLine;
          }
        }
        if (line) {
          ctx.fillText(line, borderWidth + infoPaddingX, y);
          y += lineHeight;
        }
        return y;
      };

      if (displayDescription) {
        cursorY = drawWrappedText(displayDescription, cursorY);
      } else {
        cursorY += bodyFont;
      }

      const detailTags = [entry.personName, entry.cardStyle].filter(Boolean) as string[];
      if (detailTags.length) {
        const tagFont = Math.max(14, Math.floor(bodyFont * 0.75));
        const tagHeight = Math.floor(tagFont * 1.9);
        let tagX = borderWidth + infoPaddingX;
        const tagY = cursorY + Math.floor(tagFont * 0.2);
        ctx.font = `600 ${tagFont}px 'Inter', 'Noto Sans JP', sans-serif`;
        detailTags.forEach((text) => {
          const pillWidth = ctx.measureText(text).width + tagFont * 1.6;
          ctx.fillStyle = theme.tagBg;
          drawRoundedRect(ctx, tagX, tagY, pillWidth, tagHeight, tagHeight / 2);
          ctx.fill();
          ctx.fillStyle = theme.tagText;
          ctx.textBaseline = "middle";
          ctx.fillText(text, tagX + tagFont * 0.8, tagY + tagHeight / 2 + 1);
          ctx.textBaseline = "alphabetic";
          tagX += pillWidth + tagFont * 0.8;
        });
        cursorY = tagY + tagHeight + Math.floor(tagFont * 0.6);
      }

      const serialFont = Math.floor(titleFont * 0.55);
      const serialBaseline = panelY + footerHeight - infoPaddingY;
      ctx.textAlign = "right";
      ctx.font = `700 ${serialFont}px 'Inter', sans-serif`;
      ctx.fillStyle = theme.serialColor;
      ctx.fillText(formattedSerial, img.width - infoPaddingX, serialBaseline);
      ctx.textAlign = "left";

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
              text: shareMessage,
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
    displayDescription,
    entry.personName,
    entry.cardStyle,
    entry.isLossCard,
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
            {displayDescription && <p className="text-sm text-white/80">{displayDescription}</p>}
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
                unoptimized
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
        {stars ? (
          <span className="rounded-full border border-white/15 px-4 py-1 text-amber-200">{stars}</span>
        ) : entry.isLossCard ? (
          <span className="rounded-full border border-red-300/60 px-4 py-1 text-red-200">LOSS ROUTE</span>
        ) : null}
        {entry.isLossCard && (
          <span className="rounded-full border border-red-400/40 px-4 py-1 text-red-200">NO PUCHUN</span>
        )}
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
            {!referralShareActive && (
              <p className="mt-3 text-xs text-white/70">
                紹介URLでシェアしたい場合は
                <Link href="/referrals" className="text-neon-blue underline-offset-2 hover:underline">
                  紹介コードを作成
                </Link>
                してください。
              </p>
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
                <FriendSelect
                  label="Friend"
                  friends={friends}
                  value={selectedFriend}
                  onChange={setSelectedFriend}
                />
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

type FriendSelectProps = {
  label: string;
  friends: Friend[];
  value: string;
  onChange: (id: string) => void;
};

function FriendSelect({ label, friends, value, onChange }: FriendSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const labelId = useId();

  useEffect(() => {
    function handlePointer(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointer);
    return () => document.removeEventListener("mousedown", handlePointer);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  const selectedFriend = friends.find((friend) => friend.id === value);
  const displayLabel = selectedFriend
    ? selectedFriend.display_name ?? selectedFriend.email ?? selectedFriend.id
    : "選択してください";

  const friendOptions = [
    { id: "", label: "選択してください" },
    ...friends.map((friend) => ({
      id: friend.id,
      label: friend.display_name ?? friend.email ?? friend.id,
    })),
  ];

  return (
    <div className="space-y-2 text-sm" ref={containerRef}>
      <span id={labelId} className="text-[0.6rem] uppercase tracking-[0.35em] text-white/60">
        {label}
      </span>
      <div className="relative">
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-left text-sm text-white transition hover:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue/60"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={labelId}
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className="truncate text-white/90">{displayLabel}</span>
          <ChevronDown className={`ml-3 h-4 w-4 shrink-0 text-white/60 transition ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div
            role="listbox"
            aria-labelledby={labelId}
            className="absolute left-0 right-0 z-20 mt-2 rounded-2xl border border-white/15 bg-black/90 shadow-[0_20px_45px_rgba(0,0,0,0.55)] backdrop-blur-xl"
          >
            <ul className="max-h-56 overflow-y-auto py-2 text-sm">
              {friendOptions.map((option) => {
                const selected = option.id === value || (option.id === "" && !value);
                return (
                  <li key={option.id || "placeholder"}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={`flex w-full items-center justify-between px-4 py-2 text-left text-white/85 transition hover:bg-white/10 ${
                        selected ? "bg-white/10 text-neon-green" : ""
                      }`}
                      onClick={() => {
                        onChange(option.id);
                        setOpen(false);
                      }}
                    >
                      <span className="truncate">{option.label}</span>
                      {selected && <Check className="h-4 w-4 text-neon-green" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
