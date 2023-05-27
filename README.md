# dim

[![codecov](https://codecov.io/gh/c-3lab/dim/branch/main/graph/badge.svg?token=2PXVJGUNWP)](https://codecov.io/gh/c-3lab/dim)
[![Github All Releases](https://img.shields.io/github/downloads/c-3lab/dim/total.svg)](https://github.com/c-3lab/dim/releases/latest)
[![Github All Releases](https://img.shields.io/github/downloads/c-3lab/dim/latest/total.svg)](https://github.com/c-3lab/dim/releases/latest)

Data Installation Manager: Manage the open data in your project like a package manager.

![8bket-vzuiv](https://user-images.githubusercontent.com/6661165/148486923-a29f6ea5-ecbc-4d69-9f40-66bed34e3f99.gif)

## Join community

We are looking for members to develop together as an open source community.

[Slack](https://join.slack.com/t/c3lab-hq/shared_invite/zt-v6zz66n9-1VYkVXC4zoQViWSMdzMTLg)

# Features

- [📀 Record the source url and post-processing, etc., of downloaded open-data](#install)
- [🔧 Prepare all open data needed for the project in one command by using the `dim.json` recorded by someone else](#install-the-all-data)
- [🚀 General post-processing, such as unzip, encoding, etc., is available from the start](#specify-the-installation-post-process)
- [🔍 Search open-data from CKAN](#search)
- [🧠 Generate code to process data using **GPT-3**](#generate)

# Document

For more information about how to use it, please refer to [this document](/doc).

# Quick Start

## Install the dim

[Install the dim from binary files](#install-the-dim-from-binary-files) or
[Run the dim using Deno](#run-the-dim-using-deno)

### Install the dim from binary files

Download the dim from binary files.

[aarch64-apple-darwin](https://github.com/c-3lab/dim/releases/latest/download/aarch64-apple-darwin-dim)

```
curl -L https://github.com/c-3lab/dim/releases/latest/download/aarch64-apple-darwin-dim -o /usr/local/bin/dim
```

[x86_64-apple-darwin](https://github.com/c-3lab/dim/releases/latest/download/x86_64-apple-darwin-dim)

```
curl -L https://github.com/c-3lab/dim/releases/latest/download/x86_64-apple-darwin-dim -o /usr/local/bin/dim
```

[x86_64-pc-windows-msvc](https://github.com/c-3lab/dim/releases/latest/download/x86_64-pc-windows-msvc-dim.exe)

```
curl https://github.com/c-3lab/dim/releases/latest/download/x86_64-pc-windows-msvc-dim.exe -o C:\Users\user-name\dim.exe
```

[x86_64-unknown-linux-gnu](https://github.com/c-3lab/dim/releases/latest/download/x86_64-unknown-linux-gnu-dim)

```
curl -L https://github.com/c-3lab/dim/releases/latest/download/x86_64-unknown-linux-gnu-dim -o /usr/local/bin/dim
```

#### Grant user execution permission

```
chmod u+x /usr/local/bin/dim
```

## New Project

1. init the project

Generate `dim.json`, `dim-lock.json` and `data_files/` by init command.

```
$ dim init
```

2. Install a data

This command stores information about installed data in `dim.json` and `dim-lock.json`.

```
$ dim install https://example.com -n "example"
```

3. Installed data is saved in `data_files/`.

```
$ ls ./data_files
```

## Install all data written to dim.json shared by members

Install all data written to `dim.json` shared by members.

![r30y7-wcbx7](https://user-images.githubusercontent.com/6661165/148490980-c1ae8195-a3fd-430f-aa10-c11c7cf1fd64.gif)

1. Make sure existing the dim.json in current directory

```
$ ls ./

dim.json  ....
```

2. Install all data written in the dim.json

```
$ dim install
```

3. Installed data is saved in `data_files/`.

```
$ ls ./data_files
```

# Command Usage

## [Init](doc/en/init.md)

Generate `dim.json`, `dim-lock.json` and `data_files/`.

```
$ dim init
```

## [Install](doc/en/install.md)

### Install the all data.

Install all data written to `dim.json`.

```
$ dim install
```

Install from a specified local `dim.json`.

```
$ dim install -f ./path/dim.json
```

Install from a specified remote `dim.json` in internet.

```
$ dim install -f https://raw.githubusercontent.com/xxxx/xxxx/main/dim.json
```

### Install the specified data.

```
$ dim install https://example.com -n "example"
```

#### Specify headers.

```
$ dim install https://example.com -n "example" -H "Authorization: 1234567890abc" -H "Fiware-Service: example"
```

#### Specify the installation post-process

Postprocess unzip

```
$ dim install https://example.com -n "example" -p unzip
```

Postprocess encoding

```
$ dim install https://example.com -n "example" -p "encode utf-8"
```

Postprocess xlsx-to-csv

```
$ dim install https://example.com -n "example" -p xlsx-to-csv
```

Postprocess csv-to-json

```
$ dim install https://example.com -n "example" -p csv-to-json
```

Postprocess custom command

You can specify a custom command after **"cmd"**.

```
$ dim install https://example.com -n "example" -p "cmd ******"
```

The file path will be passed as an argument at the end of the specified command.

```
$ dim install https://example.com -n "example" -p "cmd python ./tests/test_custom_command.py"
```

Command to be executed during postprocessing.

```
$ python ./tests/test_custom_command.py ./data_files/***/***.xx
```

#### Forced execution

Forced install. Overwrite already exist data file.

```
$ dim install https://example.com -n "example" -F
```

## [Uninstall](doc/en/uninstall.md)

Delete data with the specified name from `dim.json`, `dim-lock.json` and `data_files/`.

```
$ dim uninstall [name]
```

## [List](doc/en/list.md)

Display the information described in `dim-lock.json`.

```
$ dim list
```

### Simple List

```
$ dim list -s
```

## [Update](doc/en/update.md)

Update the all data.

```
$ dim update
```

Update the specified data.

```
$ dim update [name]
```

## Clean

Clean the project. Delete the data_files and init the project.

```
$ dim clean
```

## [Search](doc/en/search.md)

Search data from package_search CKAN API.

Use [データカタログ横断検索システム](https://search.ckan.jp/) by default to do the search.

```
$ dim search 避難所
```

Specify the number of data to get by option -n (default 10).

```
$ dim search 避難所 -n 3
```

### Interactive installation

Write data information to `dim.json` from ckan.

Store the data to `data_files`.

```
$ dim search -i "東京 避難所"

131105_東京都_目黒区_大地震時における地域避難所
  - Catalog URL        : https://www.geospatial.jp/ckan/dataset/131105-002
  - Catalog Description: ####大地震時における地域避難所のデータです。
####東京都目黒区のオープンデータです。【リソース】大地震時における地域避難所 / ####大地震時における地域避難所のXLSXです。
【キーワード】東京都 / 目黒区 / 避難所
  - Catalog License    : クリエイティブ・コモンズ 表示
    1. 大地震時における地域避難所
      * Resource URL        : https://www.geospatial.jp/ckan/dataset/1e07b569-80a5-4c31-8a7b-be88d1e8f327/resource/8d8de117-2342-4c61-a98d-8f7a9c5b71a2/download/131105evacuationspace.xlsx
      * Resource Description: ####大地震時における地域避難所のXLSXです。
      * Created             : 2018-10-30T02:55:40.179726
      * Format              : XLSX

131059_東京都_文京区_緊急避難場所・避難所
  - Catalog URL        : https://www.geospatial.jp/ckan/dataset/131059-025
  - Catalog Description: ####緊急避難場所・避難所のデータです。
####東京都文京区のオープンデータです。【リソース】緊急避難場所・避難所 / ####文京区の避難所・緊急避難場所の一覧データのCSVです。####更新日:2018年10月23日 / ####文京区の避難所・緊急避難場所の一覧データのXLSXです。
####更新日:2018年10月23日【キーワード】文京区 / 東京都 / 避難場所 / 避難所
  - Catalog License    : CC-BY2.1
    2. 緊急避難場所・避難所
      * Resource URL        : https://www.geospatial.jp/ckan/dataset/b17c1f51-ce1c-4e6a-8ff9-5ff0203b1e43/resource/008d34ad-61a5-4dbd-8996-fa6d647c2986/download/kinkyuhinanbasyo-hinanjo.csv
      * Resource Description: ####文京区の避難所・緊急避難場所の一覧データのCSVです。
####更新日:2018年10月23日
      * Created             : 2018-10-30T05:44:44.623645
      * Format              : CSV
    3. 緊急避難場所・避難所
      * Resource URL        : https://www.geospatial.jp/ckan/dataset/b17c1f51-ce1c-4e6a-8ff9-5ff0203b1e43/resource/0c4942d4-a149-4091-a52f-69b7da8fa143/download/kinkyuhinanbasyo-hinanjo.xlsx
      * Resource Description: ####文京区の避難所・緊急避難場所の一覧データのXLSXです。
####更新日:2018年10月23日
      * Created             : 2018-10-30T05:44:46.127915
      * Format              : XLSX
...
? Enter the number of data to install > 1
? Enter the name. Enter blank if want to use CKAN resource name. > 
? Enter the post-processing you wish to add. Enter blank if not required. > xlsx-to-csv
? Is there a post-processing you would like to add next? (Y/n) > No
Convert xlsx to csv.
Installed to ./data_files/131105_東京都_目黒区_大地震時における地域避難所_大地震時における地域避難所/131105evacuationspace.xlsx
```

## [Generate](doc/en/generate.md)

Auto-generate code about target data using **GPT-3**. For example, conversion processing, visualization processing,
etc..
<img src="https://user-images.githubusercontent.com/6661165/216978343-0c1cbedb-e709-4501-8068-deca12e805b0.gif" width=800 />

Export APIKey of OpenAI to `OPENAI_API_KEY`.

```
$ export OPENAI_API_KEY=xxxxxxxxxxxxxxxxxxxxx
```

You can get APIKey URL: https://platform.openai.com/account/api-keys

Combine the specified target data and prompt, send it to GPT-3 API, output the code, and save it.

```
$ dim generate -t "./data.csv" "Python code that converts this csv data to geojson"
```

Specify the data name managed by dim using `-t`

```
$ dim generate -t "shelter" "Python code that converts this csv data to geojson"
```

### Example prompt List

```
Python code that converts this csv data to geojson
```

```
Python code that remove id column from this csv data
```

```
Python code that visualizes this csv data as a map
```

```
Python code that visualizes this csv data as a map
```

```
Python code that visualizes this csv data as HTML page
```

```
Python code that saves this csv data to PostgreSQL
```

```
Python code that converts full-width numbers in this csv file to half-width numbers
```

## [Help](doc/en/help.md)

```
$ dim help
```

# Run the dim using Deno

1. Install Deno

- Deno == 1.28.2

```
$ curl -fsSL https://deno.land/install.sh | sh
$ echo 'export DENO_INSTALL=~/.deno' >> ~/.bashrc
$ echo 'export PATH="$DENO_INSTALL/bin:$PATH"' >> ~/.bashrc
$ source ~/.bashrc
```

2. Clone the repository

```
$ git clone https://github.com/c-3lab/dim.git
```

```
$ cd dim
```

3. Run the dim commands

```
$ deno run -A dim.ts install https://xxxxxx/data.json -n 'data_name'
```

4. Install dim

```
$ deno install --unstable --allow-read --allow-write --allow-run --allow-net --allow-env dim.ts
```

# Run test and display coverage

1. Run test

```
$ deno test -A --coverage=tests/coverage
```

2. Display coverage

```
$ deno coverage ./tests/coverage
```

# Upgrade the dim version

You need to be able to run Deno in a local environment.\
If you don't have an execution environment of Deno, please re-install.\
[Install the dim from binary files](#install-the-dim-from-binary-files)

```
$ dim upgrade
```

# Contributers

<a href="https://github.com/c-3lab/dim/graphs/contributors">
  <img src="https://contributors-img.web.app/image?repo=c-3lab/dim" />
</a>

Made with [contributors-img](https://contributors-img.web.app).

# LICENSE

[MIT LICENSE](./LICENSE)
