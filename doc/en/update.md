# update

## Overview

Update specified data.

## Run dim update with name

Search `dim-lock.json` for data matching the name given in the argument.\
If the above data is found, re-download the data and update `dim.json` and `dim-lock.json`.

```bush
dim update <name>
```

### Example

```bush
# Run update by name
dim update example
```

## Run dim install without name

Re-download all data contained in `dim.json` and update `dim.json`, `dim-lock.json`.

```bush
dim update [option]
```

### Option

#### -A, --asyncInstall

**optional**\
When downloading multiple files, the default download is a synchronous process.\
`-A` to change to an asynchronous process.

### Example

```bush
# Update all data recorded in dim.json
dim update

# Asynchronously update all data recorded in dim.json
dim update -A
```
