# dim

Data Installation Manager: Manage the open data in your project like a package
manager.

![8bket-vzuiv](https://user-images.githubusercontent.com/6661165/148486923-a29f6ea5-ecbc-4d69-9f40-66bed34e3f99.gif)

Execute all required installations by sharing dim.json.

![r30y7-wcbx7](https://user-images.githubusercontent.com/6661165/148490980-c1ae8195-a3fd-430f-aa10-c11c7cf1fd64.gif)

# Usage

## Install the dim

Donwload the dim from binary files.

[aarch64-apple-darwin](https://github.com/ryo-ma/dim/raw/main/bin/aarch64-apple-darwin/dim)

[x86_64-apple-darwin](https://github.com/ryo-ma/dim/raw/main/bin/x86_64-apple-darwin/dim)

[x86_64-pc-windows-msvc](https://github.com/ryo-ma/dim/raw/main/bin/x86_64-pc-windows-msvc/dim.exe)

[x86_64-unknown-linux-gnu](https://github.com/ryo-ma/dim/raw/main/bin/x86_64-unknown-linux-gnu/dim)

or

```
deno install --unstable --allow-read --allow-write --allow-run --allow-net dim.ts
```

## Setup the project

```
dim init
```

## Install a data

```
dim install [url] -n [name]
```

# Commands

## Init

```
dim init
```

## Install

```
dim install [url] -n [name]
```

### Preprocess unzip

```
dim install [url] -p unzip
```

### Preprocess encoding-

```
dim install [url] -p encoding-utf-8
```

### Preprocess xlsx-to-csv

```
dim install [url] -p xlsx-to-csv
```

## Uninstall

```
dim uninstall [url]
```

## List

```
dim list
```

### Simple List

```
dim list -s
```

## Update

```
dim update [name or url]
```

## Upgrade the dim version

```
dim upgrade
```

## Help

```
dim help
```
