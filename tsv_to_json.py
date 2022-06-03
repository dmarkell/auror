from __future__ import print_function

import codecs
import csv
import json
import sys
# reload(sys)

sys.stdin.reconfigure(encoding='ISO-8859-1')

typer = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {}
out_to_str = lambda x: x.decode('utf8') if type(x) == bytes else x

for ix, line in enumerate(sys.stdin):

	row = [el for el in line.strip('\n').split('\t')]

	if ix == 0:
		headers = row

	else:

		out = {}
		for i,v0 in enumerate(row):
			k = out_to_str(headers[i])
			v1 = out_to_str(eval(typer.get(headers[i], typer.get("default", "str")))(v0)) if v0 not in ('', None) else v0
			
			out[k] = v1
		print(json.dumps(out))