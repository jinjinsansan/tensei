// カウントダウンチャレンジ２ 型定義

export type Cd2Step =
  | 'standby'       // スタンバイ映像 (ループ)
  | 'title_red'     // 1秒タイトル映像赤 (期待度★オーバーレイ表示)
  | 'red_10'        // 1秒赤10映像
  | 'red_9'         // 1秒赤9映像
  | 'red_8'         // 1秒赤8映像
  | 'red_7'         // 1秒赤7映像
  | 'red_6'         // 1秒赤6映像
  | 'red_5'         // 1秒赤5映像
  | 'red_4'         // 1秒赤4映像
  | 'red_3'         // 1秒赤3映像 (ニュートラル)
  | 'red_3_win'     // 1秒赤3当たり映像
  | 'red_3_loss'    // 1秒赤3ハズレ映像
  | 'red_2'         // 1秒赤2映像 (通過)
  | 'red_2_win'     // 1秒赤2当たり映像
  | 'red_2_loss'    // 1秒赤2ハズレ映像
  | 'red_1'         // 1秒赤1映像 (通過)
  | 'red_1_win'     // 1秒赤1当たり映像
  | 'red_1_loss'    // 1秒赤1ハズレ映像 (ファイルなし時は red_loss を使用)
  | 'red_0'         // 1秒赤0映像 (通過なし・必ず結果)
  | 'red_0_win'     // 1秒赤0当たり映像
  | 'red_0_loss'    // 1秒赤0ハズレ映像
  | 'red_loss'      // 1秒赤ハズレ映像 (汎用)
  | 'patlite'       // 1秒パトライト映像 (差し込み・5→4間)
  | 'donden'        // 1秒どんでん返し映像
  | 'jackpot'       // 1秒ジャックポット映像
  | 'freeze';       // フリーズ当たり (映像なし・10秒間ボタン無効)

export type Cd2Result = 'win' | 'loss';

export interface Cd2PlayScenario {
  isWin: boolean;
  isDonden: boolean;
  isPatlite: boolean;
  isFreeze: boolean;
  sequence: Cd2Step[];
  expectationStars: number; // 1-5
}

export interface Cd2Settings {
  id: string;
  isEnabled: boolean;
  lossRate: number;    // 0-100%
  dondenRate: number;  // ハズレのうち何%がどんでん返し
  patliteRate: number; // 当たりのうち何%にパトライト差し込み
  freezeRate: number;  // 当たりのうち何%がフリーズ当たり
}
