# search

## 概要

指定したキーワードでデータを検索する。\
検索には [データカタログ横断検索サイト](https://search.ckan.jp) のAPIを利用する。\
複数のキーワードを用いる場合は、スペース区切りの文字列を指定する。

```bash
dim search [options] <keyword>
```

## オプション

### -n, --number \<num\>

**任意項目**\
検索時に取得するデータセットの最大値を指定する。\
1～100の数値を指定可能。\
初期値は10で設定されている。

### -i, --install

**任意項目**\
検索結果から対話的にデータのダウンロードを行う。\
対話型インストールでは、データの検索・取得・後処理を対話形式で指定する。

#### ダウンロードするデータの選択

検索結果の中からダウンロードしたいデータを選択する。\
データの選択は検索結果のデータごとに割り振られた番号を使用する。\
番号は`1. [Data name]`の形式で表示される。

#### 名前の指定

データを識別するための一意な名前を指定する。\
`update`, `uninstall`コマンドなどで、処理対象のデータを指定する際に使用する。\
`data_files`ディレクトリ配下にデータを保存する際、サブディレクトリの名称としても使われる。\
未指定の場合は、検索結果の`xckan_title`及び`resources`内の`name`から自動的に生成される。

#### 後処理の指定

ダウンロードしたファイルに対しての後処理を指定する。\
複数回指定可能。

| 後処理の種類          | 概要                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------ |
| unzip           | ダウンロードしたzipファイルをカレントディレクトリ内に解凍する。                                                                            |
| encode \<code\> | ダウンロードしたファイルの文字コードを変更する。<br>対応コード：UTF-16, UTF-16BE, UTF-16LE, UTF-8, ISO-2022-JP, Shift_JIS, EUC-JP, UNICODE |
| xlsx-to-csv     | ダウンロードしたxlsxファイルをcsvファイルに変換したファイルを、data_files配下に生成する。                                                        |
| cmd \<command\> | ダウンロードしたファイルのパスを引数としてコマンドを実行する。                                                                              |

### 実行例

```
# キーワードを1つ指定して検索
dim search "東京"

# キーワードを2つ指定して検索
dim search "東京 人口"

# 検索したデータセットを1つだけ表示
dim search -n 1 "東京"


# [title]
#   - Catalog URL           : データセットが公開されているサイトのURL
#   - Catalog Description   : データセットについての説明など
#   - Catalog License       : ライセンス
#     1. [Data name]
#       * Resource URL          : リソースのURL
#       * Resource Description  : リソースの説明など
#       * Created               : 作成日
#       * Format                : ファイルのフォーマット
#     2. [Data name]
#            .
#            .
#            .
#            .
#
# [title]
#            .
#            .
#            .
#            .
```

```
# 検索したデータセットから、対話的にデータのダウンロードを行う
dim search -i "東京"

# ダウンロードしたいデータの番号を指定
? Enter the number of the data to install › 1

# 名前の指定
? Enter the name. Enter blank if want to use CKAN resource name. › example

# 後処理の指定
? Enter the post-processing you want to add. Enter blank if not required. › encode utf-8

# 追加の後処理の確認
? Is there a post-processing you would like to add next? (Y/n) › No
```
