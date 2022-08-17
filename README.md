# dim

Data Installation Manager: Manage the open data in your project like a package
manager.

![8bket-vzuiv](https://user-images.githubusercontent.com/6661165/148486923-a29f6ea5-ecbc-4d69-9f40-66bed34e3f99.gif)

# Features

- 📀 Record the source url and post-processing, etc., of downloaded open-data
- 🔧 Prepare all open data in one command by using files recorded by someone else
- 🚀 General post-processing, such as unzip, encoding, etc., is available from
  the start
- 🔍 Search open-data from CKAN

# Usage

## Install the dim

[Install the dim from binary files](#install-the-dim-from-binary-files) or
[Install the dim from Deno install](#install-the-dim-from-deno-install)

### Install the dim from binary files

Donwload the dim from binary files.

[aarch64-apple-darwin](https://github.com/c-3lab/dim/raw/main/bin/aarch64-apple-darwin/dim)

```
curl https://raw.githubusercontent.com/c-3lab/dim/main/bin/aarch64-apple-darwin/dim -o /usr/local/bin/dim
```

[x86_64-apple-darwin](https://github.com/c-3lab/dim/raw/main/bin/x86_64-apple-darwin/dim)

```
curl https://raw.githubusercontent.com/c-3lab/dim/main/bin/x86_64-apple-darwin/dim -o /usr/local/bin/dim
```

[x86_64-pc-windows-msvc](https://github.com/c-3lab/dim/raw/main/bin/x86_64-pc-windows-msvc/dim.exe)

```
curl https://raw.githubusercontent.com/c-3lab/dim/main/bin/x86_64-pc-windows-msvc/dim.exe -o C:\Users\user-name\dim.exe
```

[x86_64-unknown-linux-gnu](https://github.com/c-3lab/dim/raw/main/bin/x86_64-unknown-linux-gnu/dim)

```
curl https://raw.githubusercontent.com/c-3lab/dim/main/bin/x86_64-unknown-linux-gnu/dim -o /usr/local/bin/dim
```

#### Grant user execution permission

```
chmod u+x /usr/local/bin/dim
```

### Install the dim from Deno install

1. Install Deno

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

3. Install dim

```
$ deno install --unstable --allow-read --allow-write --allow-run --allow-net dim.ts
```

## Upgrade the dim version

```
$ dim upgrade
```

## Quick Start

### New Project

1. init the project

Generate `dim.json`, `dim-lock.json` and `./data_files` by init command.

```
$ dim init
```

2. Install a data

This command stores information about installed data in `dim.json` and
`dim-lock.json`.

```
$ dim install https://example.com -n "example"
```

3. Installed data is saved in `data_files`.

```
$ ls ./data_files
```

### Install all data written to dim.json shared by members

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

3. Installed data is saved in `data_files`.

```
$ ls ./data_files
```

# Commands

## Init

```
$ dim init
```

## Install

### Install the all data.

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

Postprocess custom command

You can specify a custom command after **"CMD:"**.

```
$ dim install https://example.com -n "example" -p "CMD:******"
```

The file path will be passed as an argument at the end of the specified command.

```
$ dim install https://example.com -n "example" -p "CMD:python ./tests/test_custom_command.py"
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

## Uninstall

```
$ dim uninstall [name]
```

## List

```
$ dim list
```

### Simple List

```
$ dim list -s
```

## Update

Update the all data.

```
$ dim update
```

Update the specified data.

```
$ dim update [name]
```

## Help

```
$ dim help
```

# Contributers

<a href="https://github.com/c-3lab/dim/graphs/contributors">
  <img src="https://contributors-img.web.app/image?repo=c-3lab/dim" />
</a>

Made with [contributors-img](https://contributors-img.web.app).

# LICENSE

[MIT LICENSE](./LICENSE)
