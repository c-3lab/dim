# list

## Overview

Display all data recorded in `dim-lock.json`.

```bash
dim list [option]
```

## Option

### -s, --simple

**optional**\
Specify `-s` if only data is to be output.

## Examples

```bush
# Show all data
dim list

# output image

# example
#   - URL               : https://example.com/example.txt
#   - Name              : example
#   - File path         : ./data_files/example/example.txt
#   - Catalog URL       : https://example.com/ckan/dataset
#   - Catalog resourceid: 123abcd4-ef56-78g9-12h3-456i78j912kl
#   - Last modified     : 2021-01-02T03:04:05.678Z
#   - ETag              : "ab12-3CdEfghijK/lmnOpqrsTuvWxYZa"
#   - Last downloaded   : 2022-01-02T03:04:05.678Z

# Show data only
dim list -s

# output image
# example https://example.com/example.txt ./data_files/example/example.txt https://example.com/ckan/dataset 123abcd4-ef56-78g9-12h3-456i78j912kl 2021-01-02T03:04:05.678Z "ab12-3CdEfghijK/lmnOpqrsTuvWxYZa" 2022-01-02T03:04:05.678Z
```
