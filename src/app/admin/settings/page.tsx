"use client";

import Link from "next/link";

import { AdminCard, AdminPageHero, AdminSectionTitle } from "@/components/admin/admin-ui";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHero
        eyebrow="Legacy"
        title="旧RTP設定ツール"
        description="このページは v1 シングルキャラクター用UIの名残です。現行システムでは無効化されています。"
      />

      <AdminCard>
        <AdminSectionTitle
          title="このページは使用しないでください"
          description="下記リンクから v2 設定管理に移動してください"
        />
        <div className="mt-6 space-y-4 text-sm text-white/70">
          <p>
            現在のガチャ抽選は <strong>キャラクター別RTP設定</strong> と <strong>共通ハズレ率設定</strong> のみを参照します。
            こちらの旧UIを操作しても本番挙動には影響しません。
          </p>
          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-4 text-sm text-yellow-100">
            現行設定を変更する場合は以下のリンクへ遷移してください。
          </div>
          <div className="flex flex-col gap-3 md:flex-row">
            <Link
              href="/admin/character-rtp"
              className="flex-1 rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3 text-center font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
            >
              キャラクター別RTP設定へ
            </Link>
            <Link
              href="/admin/global"
              className="flex-1 rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3 text-center font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
            >
              共通ハズレ率設定へ
            </Link>
          </div>
        </div>
      </AdminCard>
    </div>
  );
}
