# list

## Overview

Display all data recorded in `dim-lock.json`.

```bash
dim list [option]
```

## Option

### -s, --simple

**optional**\
To output data without formatting, specify `-s`.

## Examples

```bush
# Show all data
dim list

# (output image)

# example
#   - URL               : https://example.com/example.txt
#   - Name              : example
#   - File path         : ./data_files/example/example.txt
#   - Catalog URL       : https://example.com/ckan/dataset
#   - Catalog resourceid: 012abcd3-ef45-67g8-90h1-234i56j789kl
#   - Last modified     : 2021-01-02T03:04:05.678Z
#   - ETag              : 0123ab45c67d8901e23fgh456i7890j1
#   - Last downloaded   : 2022-01-02T03:04:05.678Z

# Show data only
dim list -s

# output image
# example https://example.com/example.txt ./data_files/example/example.txt https://example.com/ckan/dataset 123abcd4-ef56-78g9-12h3-456i78j912kl 2021-01-02T03:04:05.678Z 0123ab45c67d8901e23fgh456i7890j1 2022-01-02T03:04:05.678Z
```
