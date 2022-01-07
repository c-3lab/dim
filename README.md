# dim
Data Installation Manager: Manage the open data etc. in your project like a package manager.


# Usage

## Install the dim


Donwload the dim from binary files.

[x86_64-apple-darwin](https://github.com/ryo-ma/dim/raw/main/bin/x86_64-apple-darwin/dim)

[x86_64-pc-windows-msvc](https://github.com/ryo-ma/dim/raw/main/bin/x86_64-pc-windows-msvc/dim.exe)

[x86_64-unknown-linux-gnu](https://github.com/ryo-ma/dim/raw/main/bin/x86_64-unknown-linux-gnu/dim)

or

```
deno install dim.ts
```

## Setup the project

```
dim init
```

## Install a data

```
dim install [open data url] -n [name]
```

# Commands

## Init

```
dim init
```

## Install

```
dim install [open data url] -n [name]
```

### Preprocess unzip

```
dim install [open data url] -p unzip
```

### Preprocess encoding-

```
dim install [open data url] -p encoding-utf-8
```

### Preprocess xlsx-to-csv
```
dim install [open data url] -p xlsx-to-csv
```

## Uninstall

```
dim uninstall [name or url]
```

## List

```
dim list
```

## Update

```
dim update [name or url]
```

## Upgrade

```
dim upgrade
```

## Help

```
dim help
```
