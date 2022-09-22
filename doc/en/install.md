# install

## Overview

Download data from specified URL or URL recorded in `dim.json`.\
Downloaded files are stored in `data_files`.

## Run dim install with URL

Download data from URL specified in the argument.

```bash
dim install [options] <URL>
```

### Options

#### -n, --name \<name\>

**required**\
Specify a unique name.\
This unique name will be used to specify the data in `update` and `uninstall` commands.\
Also used as the name of a subdirectory storing data in the `data_files` directory.

In dim, if the name specified by the `-n` option duplicates an existing name, it is regarded as the same data, and
downloading the same data is restricted\
Use [`-F`](#-f---force) to re-download.

#### -p, --postProcesses \<process name\>

**optional**\
Specify post-processing for downloaded files.\
(can be set multiple times)

| process name        | description                                                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| unzip               | Unzip the zip file downloaded on `data_files/<name>`.                                                                                                  |
| encode \<encoding\> | Change the character encoding of the downloaded file.<br>Supported encoding：UTF-16, UTF-16BE, UTF-16LE, UTF-8, ISO-2022-JP, Shift_JIS, EUC-JP, UNICODE |
| xlsx-to-csv         | Convert the downloaded xlsx file to a csv file, and store in `data_files/<name>`.                                                                      |
| cmd \<command\>     | Execute the command with the path of the downloaded file as an argument.                                                                               |

#### -H, --headers \<header\>

**optional**\
Specify request headers for downloads.\
(can be set multiple times)

#### -F, --force

**optional**\
Specify `-F` if you want to ignore the re-download restriction and force the data to be downloaded.\
Re-downloading with `-F` will overwrite the original data.

### Examples

```bash
# Download by specifying a URL
dim install -n example https://example.com/example.zip

# Unzip the downloaded zip file.
dim install -n example -p "unzip" https://example.com/example.zip

# Change the character encoding of the downloaded file to Shift_JIS.
dim install -n example -p "encode Shift_JIS" https://example.com/example.txt

# Convert downloaded xlsx file to csv file.
dim install -n example -p "xlsx-to-csv" https://example.com/example.xlsx

# After downloading the file, run your python program.
dim install -n example -p "cmd python ./tests/test_custom_command.py" https://example.com/example.xlsx

# After converting the character encoding of the downloaded file to UTF-8, 
# the search is performed using a proprietary Python program.
dim install -n example　-p "encode UTF-8" -p "cmd search.py" https://example.com/example.txt

# Download by specifying the header.
dim install -n example -H "Authorization: 1234567890abc" -H "Fiware-Service: example"  https://example.com/example.txt

# Re-download and overwrite the file.
dim install -n example -F https://example.com/example.txt

# Example of multiple combinations of options.
dim install -n example -p "unzip" -H "Authorization: 1234567890abc" -F https://example.com/example.zip
```

## Run dim install without URL

Download data from URL recorded in `dim.json`.\
If `-f` is not specified, it refers to `dim.json` in the current directory.

```bash
dim install [options]
```

### Options

#### -f, --file \<path or URL\>

**optional**\
Download data based on the contents of the specified `dim.json`.\
Specify `path` to specify a local file.\
Specify `URL` to specify a file on the Internet.

#### -A, --asyncInstall

**optional**\
When downloading multiple files, the default download is a synchronous process.\
`-A` to change to an asynchronous process.

#### -F, --force

**optional**\
By default, `dim.json` and `dim-lock.json` are compared and the data present only in `dim.json` are downloaded.\
Specify `-F` if you want to force downloading of all data contained in `dim.json`.\
In this case, installed data with matching names are overwritten.

### Examples

```bash
# Compare dim.json and dim-lock.json in the current directory.
# Download the data that exists only in dim.json.
dim install

# Specify local dim.json to download.
dim install -f example/dim.json

# Specify the dim.json on the Internet to download.
dim install -f https://example.com/dim.json

# Download asynchronously based on the contents of dim.json and dim-lock.json.
dim install -A

# Specify an external dim.json and download through asynchronous processing.
dim install -f https://example.com/dim.json -A

# Force download of all data contained in dim.json.
dim install -F
```
