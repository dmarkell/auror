#!/bin/bash

TD_1="/tmp/audlist_entitylist_ints.json"
TD_2="/tmp/audlist_entities.json"

cat "$1" |
python $ANALYTICS_DIR"tsv_to_json.py" '{"default": "int"}' > "$TD_1"

cat "$2" |
python $ANALYTICS_DIR"tsv_to_json.py" '{"entity_num": "int"}' > "$TD_2"

python $ANALYTICS_DIR"make_audlist_dataset_json.py" "$TD_1" "$TD_2"