# list

## Overview

Display of all data recorded in `dim-lock.json`.

```bash
dim list [option]
```

## Option

### -s, --simple

**optional**\
Specify `-s` if only data is to be output.

## Examples

```bush
dim list

# output image
# example
#   - URL               : https://example.com/example.txt
#   - Name              : example
#   - File path         : ./data_files/example/example.txt
#   - Catalog URL       : null
#   - Catalog resourceid: null
#   - Last modified     : null
#   - ETag              : null
#   - Last downloaded   : 2022-01-02T03:04:05.678Z


dim list -s

# output image
# example https://example.com/example.txt ./data_files/example/example.txt null null null null 2022-01-02T03:04:05.678Z
```
