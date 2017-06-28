
import requests
import os
import sys
import json

def send_notif(text):

    payload = {
        'text': text,
        # 'username': username
    }

    url = os.environ['WEBHOOK_URL']

    resp = requests.post(url, json=payload)

    return json.dumps(resp.text)

def send_notifs():

    for line in sys.stdin:

        send_notif(line.strip())

send_notifs()