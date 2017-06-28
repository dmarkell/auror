from __future__ import print_function

import codecs
from datetime import datetime
import json
import re
import requests
import os
import sys

from bs4 import BeautifulSoup
from requests.packages.urllib3.exceptions import InsecureRequestWarning

requests.packages.urllib3.disable_warnings(InsecureRequestWarning)
out = codecs.getwriter('utf8')(sys.stdout)

HOST = 'https://www.osteriafrancescana.it'
action_endpoint = 'wp-admin/admin-ajax.php'

def join_waitlist(date, guest_ct=2, nonce=None):

    endpoint = action_endpoint
    url = "{}/{}".format(HOST, endpoint)
    nonce = _extract_nonce(_get_landing_page_markup())

    body = {
        "action": "rd_register_waitinglist",
        "date": date,
        "covers": 2,
        "service": "dinner",
        "customer[FirstName]": "",
        "customer[Surname]": "",
        "customer[MobileCountryCode]": "1",
        "customer[Mobile]": "",
        "customer[Email]": "",
        "message":"",
        "reservations_nonce": nonce
    }

    resp = requests.post(url, data=body, verify=False)

    status_code = resp.status_code
    if status_code == 200:
        return {"success": True, "data": resp.json()}
    else:
        return {"error": "api", "msg": resp.text, "status_code": status_code}

def _extract_nonce(markup):

    patt = re.compile(r'var resObj = {[^}]+}')
    matches = patt.findall(markup)

    if matches:
        data = json.loads(matches[0].split('=')[1].strip())
        return data['reservations_nonce']
    else:
        print(markup, file=out)

def _extract_calendar(markup):

    soup = BeautifulSoup(markup)

    dates = [el['data-giorno'] for el in soup.findAll(class_='giorno open')]

    return dates

def _get_landing_page_markup():

    endpoint = 'reservations'
    params = {
        "accept": "terms"
    }

    cookies = {
        'reservations_terms': 'accept',
        'cookie_notice_accepted': 'true'        
    }

    url = "{}/{}".format(HOST, endpoint)
   
    resp = requests.get(url, cookies=cookies, verify=False)

    return resp.text

def _get_calendar_and_nonce():

    markup = _get_landing_page_markup()
    nonce = _extract_nonce(markup)
    dates = _extract_calendar(markup)

    return {"nonce": nonce, "dates": dates}

def _get_availability(opts):

    if opts.has_key('nonce'):
        nonce = opts['nonce']
    else:
        nonce = _extract_nonce(_get_landing_page_markup())
        if nonce == None:
            return {"error": "api", "msg": "Could not retrieve nonce"}

    date = opts['date']
    service = opts.get('service', 'dinner')
    guest_ct = int(opts.get('guest_ct', 2))

    endpoint = action_endpoint
    url = "{}/{}".format(HOST, endpoint)

    body = {
        "service": service,
        "guests": guest_ct,
        "date": date,
        "action": "rd_check_availability",
        "reservations_nonce": nonce
    }

    resp = requests.post(url, data=body, verify=False)

    status_code = resp.status_code
    if status_code == 200:
        return {"success": True, "data": resp.json(), "nonce": nonce}
    else:
        return {"error": "api", "msg": resp.text, "status_code": status_code, "request": body}

def get_config(opts):

    result = _get_calendar_and_nonce()
    result['updated_at'] = datetime.now().strftime('%s')

    print(json.dumps(result))

def get_availability(opts):

    print(json.dumps(_get_availability(opts)))

def main():

    print(_get_landing_page_markup(), file=out)

if __name__ == "__main__":

    methods = {
        'main': main,
        'get_config': get_config,
        'get_availability': get_availability
    }
    arg_size = len(sys.argv)
    method_name = sys.argv[1] if arg_size > 1 else 'main'
    method = methods[method_name]

    opts = dict([el.split('=',1) for el in sys.argv[2:]]) if arg_size > 2 else {}

    method(opts)



