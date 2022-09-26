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

```bash
# Show all data
dim list

# Output image
> example
>   - URL               : https://example.com/example.txt
>   - Name              : example
>   - File path         : ./data_files/example/example.txt
>   - Catalog URL       : https://example.com/ckan/dataset
>   - Catalog resourceid: 123abc45-67de-890f-1234-234a56b789cd
>   - Last modified     : 2021-01-02T03:04:05.678Z
>   - ETag              : 0123ab45c67d8901e23fab456c7890d1
>   - Last downloaded   : 2022-01-02T03:04:05.678Z

# Show data only
dim list -s

# Output image
> example https://example.com/example.txt ./data_files/example/example.txt https://example.com/ckan/dataset 123abc45-67de-890f-1234-234a56b789cd 2021-01-02T03:04:05.678Z 0123ab45c67d8901e23fab456c7890d1 2022-01-02T03:04:05.678Z
```
