# WebAudioAPP
ブラウザ上で動く、SF2 + SMF 再生シンセサイザー(学習用に、ほぼフルスクラッチ)


## 実装済み/未実装機能
### MIDI
| CC     | 名前                      | 状態 |
|:---:   |:---:                      |:--- | 
| 0      | バンクセレクトMSB         | 実装済み(CC32 の LSB は無視) |
| 1      | モジュレーションホイール  | これから(ビブラート深さ)     |
| 6      | データエントリー MSB      | RPN 用に実装済み             |
| 7      | ボリューム                | 実装済み                     |
| 10     | パン                      | 実装済み                     | 
| 11     | エクスプレッション        | 実装済み                     |
| 32〜63 | 0〜31 の LSB(細かい値)    | ほぼ使われない(CC32 のバンクセレクト LSB のみ GM2 で使われる) | 
| 38     | データエントリー LSB      | RPN の細かい値(必要になったら) |
| 64     | サステイン(ダンパーペダル) | 実装済み		      |
| 66     | ソステヌート              | 実装済み			      |
| 67     | ソフトペダル              | 実装済み			      |
| 91     | リバーブセンド            | 実装済み			      |
| 93	 | コーラスセンド	     | これから			      |
| 98 / 99 | NRPN LSB / MSB           | 未対応(機種依存の細かな音色調整に使われる) |
| 100 / 101 | RPN LSB / MSB          | 実装済み(ベンド幅用)
| 120    | オールサウンドオフ	       | 実装済み	|
| 121    | リセットオールコントローラー| 実装済み	|
| 123    | オールノートオフ            | 実装済み	|

- MSB: Most Significant Byte (最上位バイト)
- LSB: Least Significant Byte (最下位バイト)
- RPN: Ragisterd Parameter Number (登録済みパラメーター番号)
- NRPN: Non-Ragisterd Parameter Number (未登録済みパラメーター番号)

## Sound Fontジェネレーター



## 実装済み機能
- Sound Font2、SMF(MIDI)の読み込み、解析
- Sound Fontのジェネレーターへの対応、音量エンベローブ、フィルタ、パンなど
- MIDIのノートOn/Off、CC7/10/11、ビッチベンド、ペダルイベント等

## 未対応機能
- Sound Font3の読み込み、Ogg Vorbis(非可逆圧縮)形式への対応
- MIDIのCC1(チャンネルプレッシャー)、CC91/93
- Sound Fontのモジュレーター

## 使用素材
### MIDI

| 名前                         | 作者                 | ライセンス    | 同梱 | URL |
|:---                          |:---                  |:---:          |:---: |:--- |
| 交響曲第7番イ長調            | ベートヴェン         | public domain | 〇   | <https://www.mutopiaproject.org/cgibin> |
| エリート・シンコペーションズ | スコット・ジョプリン | public domain | 〇   | <https://www.mutopiaproject.org/cgibin> |
| パイナップル・ラグ           | スコット・ジョプリン | public domain | 〇   | <https://www.mutopiaproject.org/cgibin> |
| ポッサムとポッターズ         | チャールズ・ハンター | public domain | 〇   | <https://www.mutopiaproject.org/cgibin> |
| トッカータとフーガ ニ短調    | BWV 565、伝バッハ    | public domain | 〇   | <https://www.mutopiaproject.org/cgibin> |

### Sound Font
| 名前               | 作者                 | ライセンス    | 同梱 | URL |
|:---                |:---                  |:---:          |:---: |:--- |
| GeneralUser-GS.sf2 | [S. Christian Collins](https://github.com/mrbumpy409) | Original | 〇 | [Github](https://github.com/mrbumpy409/GeneralUser-GS) |

## ライセンス
このリポジトリはMITライセンスで公開しています。
詳しくは[こちら](./LICENSE)を参照してください。