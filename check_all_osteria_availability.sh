#!/bin/bash

time python scrape_osteria.py get_config > config.json

nonce=`cat config.json | jq '.nonce' | tr -d \"`

cat config.json |
jq '.dates[]' |
tr -d \" |
parallel 'python scrape_osteria.py get_availability nonce=46731a2712 date={};' > availability.json
