# install

## 概要

指定したURL、もしくは`dim.json`に記録されているURLからファイルをダウンロードする。\
ダウンロードされたファイルは`data_files`配下に保存される。

## URLを指定して実行

引数に指定されたURLからデータをダウンロードする。

```bash
dim install [options] <URL>
```

### オプション

#### -n, --name \<name\>

**必須項目**\
データを識別するための一意な名前を指定する。\
`update`, `uninstall`コマンドで、処理対象のデータを指定する際に使用する。\
`data_files`ディレクトリ配下にデータを保存する際、サブディレクトリの名称としても使われる。

dim では -n オプションで指定された名称が、既存の名称と重複した場合、 同一データとみなしデータの再ダウンロードを制限している。

#### -p, --postProcesses \<process name\>

**任意項目**\
ダウンロードしたファイルに対する後処理を指定する。\
複数指定可能

| 後処理の種類              | 概要                                                                                                                |
| ------------------- | ----------------------------------------------------------------------------------------------------------------- |
| unzip               | ダウンロードしたzipファイルを`data_files/<name>`配下に解凍する。 エエン                                                                   |
| encode \<encoding\> | ダウンロードしたファイルの文字コードを変更する。<br>対応エンコーディング：UTF-16, UTF-16BE, UTF-16LE, UTF-8, ISO-2022-JP, Shift_JIS, EUC-JP, UNICODE |
| xlsx-to-csv         | ダウンロードしたxlsxファイルをcsvファイルに変換したファイルを、`data_files/<name>`配下に生成する。                                                    |
| csv-to-json         | ダウンロードしたcsvファイルをjsonファイルに変換したファイルを、`data_files/<name>`配下に生成する。                                                    |
| cmd \<command\>     | ダウンロードしたファイルのパスを引数としてコマンドを実行する。                                                                                   |

#### -H, --headers \<header\>

**任意項目**\
ダウンロード時のリクエストヘッダーを指定する。\
複数指定可能

#### -F, --force

**任意項目**\
再ダウンロードの制限を無視して、 データを強制的にダウンロードしたい場合は`-F`を指定する。\
`-F`を指定して再ダウンロードすると、元のデータは上書きされる。

### 実行例

```bash
# URLを指定してダウンロードする
dim install -n example https://example.com/example.zip

# ダウンロードしたzipファイルを解凍処理する。
dim install -n example -p "unzip" https://example.com/example.zip

# ダウンロードしたファイルの文字コードをShift_JISに変更する。
dim install -n example -p "encode Shift_JIS" https://example.com/example.txt

# ダウンロードしたxlsxファイルをcsvファイルに変換する。
dim install -n example -p "xlsx-to-csv" https://example.com/example.xlsx

# ダウンロードしたcsvファイルをjsonファイルに変換する。
dim install -n example -p "csv-to-json" https://example.com/example.csv

# ファイルをダウンロード後に、独自のpythonプログラムを実行する。
dim install -n example -p "cmd python ./tests/test_custom_command.py" https://example.com/example.xlsx

# ダウンロードしたファイルの文字コードをUTF-8に変換した後に独自のPythonプログラムを用いて検索を行う。
dim install -n example　-p "encode UTF-8" -p "cmd search.py" https://example.com/example.txt

# ヘッダーを指定してダウンロードする。
dim install -n example -H "Authorization: 1234567890abc" -H "Fiware-Service: example"  https://example.com/example.txt

# 再ダウンロードを行いファイルを上書きする。
dim install -n example -F https://example.com/example.txt

# オプションの複数組み合わせ例。
dim install -n example -p "unzip" -H "Authorization: 1234567890abc" -F https://example.com/example.zip
```

## URLを指定せずに実行

`dim.json`に記録されているURLからファイルのダウンロードを行う。\
`-f`を指定していない場合は、カレントディレクトリに存在する`dim.json`を参照する。

```bash
dim install [options]
```

### オプション

#### -f, --file \<path or URL\>

**任意項目**\
指定した`dim.json`の内容を元にダウンロードを行う。\
ローカルファイルを指定する場合は`path`を指定する。\
インターネット上のファイルを指定する場合は`URL`を指定する。

#### -A, asyncInstall

**任意項目**\
複数ファイルをダウンロードする場合、デフォルトでは同期処理でダウンロードを行う。\
`-A`を指定することで非同期処理に変更される。

#### -F, --force

**任意項目**\
デフォルトでは、`dim.json`と`dim-lock.json`を比較し、`dim.json`にのみ存在するデータのダウンロードを行う。\
`dim.json` に含まれる全てのデータを強制的にダウンロードしたい場合は`-F`を指定する。\
この場合、名称が一致するインストール済みのデータは上書きされる。

### Examples

```bash
# カレントディレクトリの dim.jsonとdim-lock.jsonを比較し、dim.jsonにのみ存在するデータのダウンロードする。
dim install

# ローカルの dim.json を指定してダウンロードする。
dim install -f example/dim.json

# インターネット上の dim.json 指定してダウンロードする。
dim install -f https://example.com/dim.json

# dim.json と dim-lock.json の内容を元に、非同期処理でダウンロードする。
dim install -A

# 外部の dim.json を指定し、非同期処理でダウンロードする。
dim install -f https://example.com/dim.json -A

# dim.json に含まれる全てのデータを強制的にダウンロードする 。
dim install -F
```
