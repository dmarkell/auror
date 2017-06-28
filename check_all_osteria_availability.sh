#!/bin/bash

CONFIG_FILE="osteria_config.json"
TEMP_FILE="osteria_availability.json"

nonce_age=$(echo $(date "+%s")" - "$(cat /tmp/"$CONFIG_FILE" | jq '.updated_at' | tr -d \") | bc)

if [[ $nonce_age < 3600 ]]
    then
        time python scrape_osteria.py get_config > /tmp/"$CONFIG_FILE"
fi

nonce=`cat /tmp/"$CONFIG_FILE" | jq '.nonce' | tr -d \"`

time cat /tmp/"$CONFIG_FILE" |
jq '.dates[]' |
tr -d \" |
parallel python scrape_osteria.py get_availability nonce="$nonce" date={} > /tmp/"$TEMP_FILE"

time cat /tmp/"$CONFIG_FILE" |
jq '.dates[]' |
tr -d \" |
parallel python scrape_osteria.py get_availability nonce="$nonce" date={} service=lunch  >> /tmp/"$TEMP_FILE"

# notify

echo "Checked reservations "$(date)":" | python send_slack_notification.py
cat /tmp/"$TEMP_FILE" |
jq -c 'select(.data.response.TimeSlots != []) |'\
'[.data.availability_search, .data.response.TimeSlots]' |
python send_slack_notification.py