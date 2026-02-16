import { redirect } from 'next/navigation';

// v2: キャラクター別RTP設定ページに移行しました
export default function CharacterAdminPage() {
  redirect('/admin/character-rtp');
}
