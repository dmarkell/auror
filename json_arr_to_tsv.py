from __future__ import print_function

import codecs
import json
import sys

sep='\t'

null_val = sys.argv[1] if len(sys.argv) > 1 else ''

def fmt(item):

    if item is None:
        return null_val
    elif type(item) in (list, tuple, dict):
        return json.dumps(item)
    elif type(item) in (str,):
        return item.replace('\t', '\\t').replace('\n', '\\n')
    elif type(item) == bytes:
        return item.decode()
    else:
        return item

for line in sys.stdin:

    try:
	    print(*[fmt(el) for el in json.loads(line)], sep=sep)
    except ValueError as e:
        print(line, file=sys.stderr)
        raise e