# search

## Overview

Search for data using specified keywords.\
The search uses the [Data Catalog Cross Search System](https://search.ckan.jp) API.\
If multiple keywords are used, specify space-separated strings.

```bash
dim search [options] <keyword>
```

## Option

### -n, --number \<num\>

**optional**\
Specify the maximum the data set to be retrieved during a search.\
A number between 1 and 100 can be specified.\
The default value is set at 10.

### -i, --install

**optional**\
Interactive data download from search results.\
In interactive installations, data search, retrieval, and post-processing are specified interactively.

#### Selecting the data to be installed

Select the data you want to download from the search results.\
The data selection uses a number allocated to each search result data.\
The numbers are in the form `1.[Data name]`.

#### Specify name

Specify a unique name to identify the data.\
Used in `update`, `uninstall` commands to specify the data to be processed.\
Also used as the name of a subdirectory when storing data under the `data_files` directory.\
If unspecified, it is automatically generated from `xckan_title` and `resource_names`, which are JSON keys obtained from
[Data Catalog Cross Search System](https://search.ckan.jp).

#### Specify post-processing

Specify post-processing for downloaded files.\
(can be set multiple times)

| process name    | description                                                                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| unzip           | Unzip the downloaded zip file under `data_files`.                                                                                                  |
| encode \<code\> | Change the character encoding of the downloaded file.<br>Supported code：UTF-16, UTF-16BE, UTF-16LE, UTF-8, ISO-2022-JP, Shift_JIS, EUC-JP, UNICODE |
| xlsx-to-csv     | Convert the downloaded xlsx file to a csv file, and Save the under `data_files`.                                                                   |
| cmd \<command\> | Execute the command with the path of the downloaded file as an argument.                                                                           |

### Examples

```
# Search by specifying keyword.
dim search "Tokyo"

# Search by specifying two keywords.
dim search "Tokyo population"

# Show only one retrieved dataset.
dim search -n 1 "Tokyo"


# [title]
#   - Catalog URL           : URL of the site where the dataset is published
#   - Catalog Description   : Description of data set
#   - Catalog License       : licence
#     1. [Data name]
#       * Resource URL          : URL of the resource
#       * Resource Description  : Description of resource
#       * Created               : creation day
#       * Format                : File format
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
# Interactively download data from retrieved datasets
dim search -i "Tokyo"

# Specify the number of the data you want to download.
? Enter the number of the data to install › 1

# Specify a unique name.
? Enter the name. Enter blank if want to use CKAN resource name. › example

# Specify post-processing.
? Enter the post-processing you want to add. Enter blank if not required. › encode utf-8

# Confirmation of additional post-processing.
? Is there a post-processing you would like to add next? (Y/n) › No
```
