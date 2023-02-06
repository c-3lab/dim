import csv
import json

# open csv file
with open('data.csv', 'r') as csvfile:
    reader = csv.DictReader(csvfile)
    # create empty list
    features = []
    # loop through each row in csv
    for row in reader:
        # create empty feature
        feature = {
            'type': 'Feature',
            'properties': {},
            'geometry': {
                'type': 'Point',
                'coordinates': []
            }
        }
        # add properties to feature
        feature['properties']['name'] = row['名称']
        feature['properties']['address'] = row['住所表記']
        feature['properties']['phone'] = row['電話番号']
        # add coordinates to feature
        feature['geometry']['coordinates'] = [float(row['経度']), float(row['緯度'])]
        # add feature to features list
        features.append(feature)

# create geojson object
geojson = {
    'type': 'FeatureCollection',
    'features': features
}

# write geojson object to file
with open('data.geojson', 'w') as outfile:
    json.dump(geojson, outfile)