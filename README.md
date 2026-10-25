# WebAudioAPP
ブラウザ上で動く、SF2 + SMF 再生シンセサイザー(学習用に、ほぼフルスクラッチ)

## 実行環境

### ブラウザで試す
[Vite による GitHub Pages](https://t-yasusi.github.io/web_audio_app/) で、インストール不要で動作を確認できます。

### ローカルで実行する
本プロジェクトは Node.js + yarn で開発しており、フロントエンドには TypeScript ベースの Vite を使用しています。パッケージ管理は Yarn の Plug'n'Play(PnP)方式です。

```bash
$ corepack enable   # package.json の packageManager に従って yarn 4 を使うため(初回のみ)
$ yarn install      # 依存パッケージのインストール
$ yarn run dev      # 開発サーバーの起動(ローカル実行用)
$ yarn run build    # TypeScript のコンパイルを含むビルド
```

### 開発環境
| ツール  | 開発時のバージョン |
|:---     |:--- |
| Node.js | v22.18.0 |
| yarn    | 4.9.2 |

上記のバージョンで開発・動作確認をしています。これより古いバージョンでも動く可能性はありますが、未検証です。

## 実装済み/未実装機能
### 参考にした仕様
- [SoundFont Technical Specification 2.04](https://polyphone.io/doc/files/sf_specifications_v2.04.pdf)(Polyphone が公開している PDF)
- [MIDI 1.0 Detailed Specification](https://midi.org/midi-1-0-detailed-specification)(MIDI Association)

### 実装済み
- SoundFontパーサー `src/sf`に実装、sf3形式(MuseScoreの独自拡張)は未実装
- SMF(Standard MIDI File)パーサー `src/midi`に実装
- 基本的な演奏、`src/web_audio`に実装

リバーブとコーラスは実装してるがそのパラメーターは実装独自の設計値による。

### 未実装
- MidiのSysExイベントへの対応
- 拍子、調号、歌詞、マーカー、キューポイント、トラック名等のMidiMetaイベントへの対応、再生に不要なので読み飛ばしている
- SoundFontのモジュレーター(imod/pmod)、一部固定ジェネレーターを使うものは実装済み
- SoundFontのexclusive_class(ジェネレーター57)

より細かい実装/未実装は以下の表を参照のこと
### MIDI
| CC     | 名前                      | 状態 |
|:---:   |:---:                      |:--- | 
| 0      | バンクセレクトMSB         | 実装済み(CC0のLSB(CC32)は無視) |
| 1      | モジュレーションホイール  | 未実装                       |
| 6      | データエントリー MSB      | RPN 用に実装済み             |
| 7      | ボリューム                | 実装済み                     |
| 10     | パン                      | 実装済み                     | 
| 11     | エクスプレッション        | 実装済み                     |
| 38     | データエントリー LSB      | RPN の細かい値(必要になったら) |
| 32〜63 | 0〜31 の LSB(細かい値)    | ほぼ使われない(CC32 のバンクセレクト LSB のみ GM2 で使われる) |
| 64     | サステイン(ダンパーペダル) | 実装済み		      |
| 66     | ソステヌート              | 実装済み			      |
| 67     | ソフトペダル              | 実装済み			      |
| 91     | リバーブセンド            | 実装済み			      |
| 93	 | コーラスセンド	     | 実装済み			      |
| 98 / 99 | NRPN LSB / MSB           | 未対応(機種依存の細かな音色調整に使われる) |
| 100 / 101 | RPN LSB / MSB          | 実装済み(ベンド幅用) |
| 120    | オールサウンドオフ	       | 実装済み	|
| 121    | リセットオールコントローラー| 実装済み	|
| 123    | オールノートオフ            | 実装済み	|

- MSB: Most Significant Byte (最上位バイト)
- LSB: Least Significant Byte (最下位バイト)
- RPN: Registered Parameter Number (登録済みパラメーター番号)
- NRPN: Non-Registered Parameter Number (未登録済みパラメーター番号)

## SoundFontジェネレーター
| 番号 | 名前					| 単位                  | 範囲        | 既定値 | 実装 |
|:---: |:---:                         		| :---                	|:---:        |:---:   |:---: | 
| 0    | Start Address Offset          		| サンプル     	      	| 0以上       | 0      | × | 
| 1    | End Address Offset            		| サンプル     	      	| 0以上       | 0      | × |
| 2    | Start Loop Address Offset     		| サンプル     	      	| $\pm$       | 0      | × |
| 3    | End Loop Address Offset      		| サンプル     	      	| $\pm$       | 0      | × |
| 4    | Start Address Coarse         		| 32768サンプル	      	| 0以上       | 0      | × |
| 5    | Mod LFO To Pitch             		| セント       	      	| $\pm 12000$ | 0 | 〇 |
| 6    | Vib LFO to Pitch             		| セント       	      	| $\pm 12000$ | 0 | 〇 |
| 7    | Mod Env to Pitch             		| セント       	      	| $\pm 12000$ | 0 | 〇 |
| 8    | Initial Filter Fc            		| 絶対セント   	      	| $1500 ~ 13500$ | 13500 | 〇 |
| 9    | Initial Filter Q             		| cB       	      	| $0 ~ 960$ | 0 | 〇 |
| 10   | Mod LFO To Filter Fc         		| セント       	      	| $\pm 12000$ | 0 | 〇 |
| 11   | Mod Env To Filter Fc         		| セント       	      	| $\pm 12000$ | 0 | 〇 |
| 12   | End Address Coarse Offset     		| 32768サンプル	      	| 0以下  | 0      | × |
| 13   | Mod LFO To Volume            		| cB       	      	| $\pm 960$ | 0 | 〇 |
| 14   | (未使用) | - | - | - | -     |
| 15   | Chorus Effect Send			| 0.1%			| 0~1000        | 0 | 〇 |
| 16   | Reverb Effect Send           		| 0.1% 		      	| 0~1000        | 0 | 〇 |
| 17   | pan                          		| 0.1% 		      	| $\pm 500$     | 0 | 〇 |
| 18~20 | (未使用) | -                | - | - | - |
| 21   | Delay Mod LFO                	      	| タイムセント	        | -12000 ~ 5000 | -12000 | 〇 |
| 22   | Freq Mod LFO      	      		| 絶対セント            | -16000 ~ 4500 | 0      | 〇 |
| 23   | Delay Vib LFO                		| タイムセント          | -12000 ~ 5000 | -12000 | 〇 |
| 24   | Freq Vib LFO             		| 絶対セント            | -16000 ~ 4500 | 0      | 〇 |
| 25   | Delay Mod Env            		| タイムセント          | -12000 ~ 5000 | -12000 | 〇 |
| 26   | Attack Mod Env               		| タイムセント          | -12000 ~ 8000 | -12000 | 〇 |
| 27   | Hold  Mod Env                		| タイムセント          | -12000 ~ 5000 | -12000 | 〇 |
| 28   | Decay Mod Env                		| タイムセント          | -12000 ~ 8000 | -12000 | 〇 |
| 29   | Sustain Mod Env              		| 0.1%(減衰量)          | 0-1000   	| 0 	 | 〇 |
| 30   | Release Mod Env               		| タイムセント          | -12000 ~ 8000 | -12000 | 〇 |
| 31   | Keynum To Mod Env Hold       		| タイムセント/キー     | $\pm 1200$    | 0 	| 〇 | 
| 32   | Keynum To Mod Env Decay      		| タイムセント/キー     | $\pm 1200$    | 0	| 〇 | 
| 33   | Delay Vol Env 	   	      		| タイムセント          | -12000 ~ 5000 | -12000 | 〇 |
| 34   | Attack Vol Env 	      		| タイムセント          | -12000 ~ 8000 | -12000 | 〇 |
| 35   | Hold Vol Env		      		| タイムセント          | -12000 ~ 5000 | -12000 | 〇 |
| 36   | Decay Vol Env 		      		| タイムセント          | -12000 ~ 8000 | -12000 | 〇 |
| 37   | Sustain Vol Env 	      		| cB(減衰量)            | 0 ~ 1440      | 0 	| 〇 |
| 38   | Release Vol Env 	      		| タイムセント          | -12000 ~ 8000 | -12000 | 〇 |
| 39   | Keynum To Vol Env Hold       		| タイムセント/キー     | $\pm 1200$    | 0 	| 〇 | 
| 40   | Keynum To Vol Env Decay      		| タイムセント/キー     | $\pm 1200$    | 0 	| 〇 | 
| 41   | Instrument                   		| インデックス          | -             | - 	| 〇 | 
| 42   | (予約)                       		| -                     | -             | -      | -  |
| 43   | Key Range                    		| キー番号(最大/最小)   | -           	| -      | 〇 |
| 44   | Vel Range                        	| べロシティ(最大/最小) | -         	| -      | 〇 |
| 45   | Start Loop Address Coarse Offset 	| 32768サンプル         | $\pm$       	| 0      | ×  |
| 46   | Key Num                          	| キー番号              | 0 ~ 127       | -1(無効) | × |
| 47   | Velocity                     	  	| ベロシティ            | 0 ~ 127       | -1(無効) | × |
| 48   | Initial Attenuation           	  	| cB                    | 0 ~ 1440      | 0      | 〇 |
| 49   | (予約)                       	  	| -                     | -             | -      | -  |
| 50   | End Loop Address Coarse Offset   	| 32768サンプル         | $\pm$ 	| 0      | ×  |
| 51   | Coarase Tune                      	| 半音                  | $\pm 120$     | 0      | 〇 |
| 52   | Fine Tune                    	  	| セント                | $\pm 99$      | 0      | 〇 |
| 53   | Sample ID                    	  	| インデックス          | -             | -      | 〇 |
| 54   | Sample Mode                  	  	| ビットフラグ          | -             | 0      | 〇 |
| 55   | (予約)                       	  	| -                     | -             | -      | -  |
| 56   | Scale Tuning                 	  	| セント/キー           | 0 ~ 1200      | 100    | 〇 |
| 57   | Exclusive Class              	  	| クラス番号            | 1 ~ 127       | 0(無効) | × |
| 58   | Overriding Root Key          	  	| キー番号              | 0 ~ 127       | -1(無効) | 〇 |

## 使用素材
### MIDI

| 名前                         | 作者                 | ライセンス    | 同梱 | URL |
|:---                          |:---                  |:---:          |:---: |:--- |
| 交響曲第7番イ長調            | ベートーヴェン       | public domain | 〇   | [Mutopia Project](https://www.mutopiaproject.org) |
| エリート・シンコペーションズ | スコット・ジョプリン | public domain | 〇   | [Mutopia Project](https://www.mutopiaproject.org) |
| パイナップル・ラグ           | スコット・ジョプリン | public domain | 〇   | [Mutopia Project](https://www.mutopiaproject.org) |
| ポッサムとポッターズ         | チャールズ・ハンター | public domain | 〇   | [Mutopia Project](https://www.mutopiaproject.org) |
| トッカータとフーガ ニ短調    | BWV 565、伝バッハ    | public domain | 〇   | [Mutopia Project](https://www.mutopiaproject.org) |
| rock_intense_10411           | | [CC0](https://creativecommons.org/publicdomain/zero/1.0/) | 〇 | [Keynata Commons Music Pack](https://carf-coder.itch.io/keynata-commons-music-pack) | 

### SoundFont
| 名前               | 作者                 | ライセンス    | 同梱 | URL |
|:---                |:---                  |:---:          |:---: |:--- |
| GeneralUser-GS.sf2 | [S. Christian Collins](https://github.com/mrbumpy409) | Original | 〇 | [Github](https://github.com/mrbumpy409/GeneralUser-GS) |
| FluidR3_GM.sf2     | Frank Wen            | MIT           | ×   | [Github](https://github.com/Jacalz/fluid-soundfont) |
| MuseScore_General.sf2 | Frank Wen, Michael Cowgill, S. Christian Collins | MIT | ×   | [MuseScore](https://musescore.com/) |

下二つはファイルサイズが大きいため同梱はしない。

## ライセンス
このリポジトリはMITライセンスで公開しています。
詳しくは[こちら](./LICENSE)を参照してください。