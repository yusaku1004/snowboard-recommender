# 楽天データ更新レポート（2026-11-15）

- 対象モデル: 1131
- 現行年式の実売価格を取得: 467（41%）
- 2027年モデルの出品を検出: 636
- 2027年モデルを新たに自動追加（前年仕様を引き継ぎ）: 8
- ウエスト幅を取得: 今回 310モデル / 累計 483モデル

## 今回自動追加したモデル

- ACC NUDE
- BATALEON Funkink
- BATALEON ThunderStorm
- GRAY LOVEBUZZ 52
- NIDECKER Venus
- PLUTONIUM IMAGINATION
- SPREAD AX-F
- TWELVE STREET JACK

## 未登録の2027年モデル候補（16件）

既存データに一致しなかった出品です。新作であれば CSV に追記して `npm run import:csv <ファイル>` で取り込んでください。

| ブランド | 出品名 | 価格 |
|---|---|---|
| ACC | 日本正規品 スノーボード 板 アジアン カン コントローラーズ エーシーシー ACC MINORITY マイノリティ メンズ レディース 26-27 | ¥84,700 |
| ARBOR | 26-27 ARBOR/アーバー CADENCE ケイデンス レディース パーク MELODIE PERRAULT メロディペロー スノーボード 板 2027 | ¥75,900 |
| BC STREAM | [即出荷] フォローズ限定 26-27 BC Stream スノーボード ビーシーストリーム RIDER'S SPEC DR ライダーズ スペック 161cm 155Wcm 162 | ¥129,800 |
| BC STREAM | [即出荷] 26-27 ビーシーストリーム BC Stream SNOWBOARDS スノーボード RIDER'S SPEC DR ライダーズ スペック 148cm 154cm 1 | ¥129,800 |
| BC STREAM | [即出荷] 26-27 BC Stream SNOWBOARDS ビーシーストリーム スノーボード RIDER'S SPEC DR ライダーズ スペック 148cm 154cm 1 | ¥129,800 |
| DEATH LABEL | 26-27 DEATH LABEL/デスレーベル DEATH SERIES LTD 2×DAYZE デスシリーズリミテッド メンズ スノーボード パーク 板 2027 | ¥76,230 |
| JONES | 【要エントリーP10倍】予約 26-27 スノーボード 板 ジョーンズ フリーカーバー JONES Men’s Stratos Ltd Far East Limited レディース | ¥118,800 |
| RIDE | 26-27 RIDE/ライド JACOB PRO BURNOUT バーンアウト メンズ レディース スノーボード 板 2027 予約商品 | ¥97,900 |
| ROME | 26-27 ROME/ローム RENR レネ・リンネカンガス メンズ スノーボード フリーラン パーク 板 2027 予約商品 | ¥89,100 |
| SIMS | SIMS シムス スノーボード 板 【2026-2027】 NUB × NUT-BUTTER | ¥84,150 |
| TJ Brand | 【TJ BRAND】 ティージェイ ブランド 【Flying-V A.B.M. 160cm】 2026-2027 Model スノーボード パウダー | ¥156,200 |
| TJ Brand | 即納★店頭受取OK★[日本正規品]26-27 TJ BRAND ティージェイブランド スノーボード 板 パウダー フリーライド スワローテール FLYING-V P.A.C. 20 | ¥159,500 |
| TJ Brand | 即納★店頭受取OK★[日本正規品]26-27 TJ BRAND ティージェイブランド スノーボード 板 パウダー フリーライド 3Dソール GOLDEN BAT BONZAR 20 | ¥154,000 |
| ThirtyTwo | 【要エントリーP10倍】予約 スノーボード 板 サーティーツー thirtytwo MIDDLE EARTH ミドル アース 26-27 T27SNUMEP ORANGE 日本正規 | ¥102,960 |
| ThirtyTwo | 【要エントリーP10倍】予約 スノーボード 板 サーティーツー thirtytwo VOLCOM MOCLOV ボルコム モロトフ 26-27 T27SNMMOC WHITE 日本 | ¥94,050 |
| ThirtyTwo | 【要エントリーP10倍】予約 スノーボード 板 サーティーツー thirtytwo XXX FAVA PRO ファーベ プロ 26-27 T27SNMPAT WHITE 日本正規品 | ¥102,960 |

対象外として候補から除いた出品（`src/lib/rakutenMatch.ts` の `DISCOVER_IGNORE`）:

- FIELD EARTH（バックカントリー向け。サイズごとにモデル名が分かれ、仕様が取れない）: 25件
- スプリットボード: 8件
- アルペンボード: 6件

