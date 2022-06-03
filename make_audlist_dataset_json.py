#!/usr/bin/python

from __future__ import print_function
import json
import sys

## Arg 1 [Optional]: filename with metadata; otherwise use audience id sorted numerically
## Arg 2 [Optional]: resampling rate for counts

entitylist_ints = []
entities_meta = None
all_ids = set()

def unescape_daiquery_json(raw):

	# e.g. `["a", "b", "c"]` is escaped as 
	# `"[""a"",""b"",""c""]"]`
	# so this:
	# 1. replaces two double-quotes with one double-quote
	# 2. removes leading & trailing double-quotes

	if raw[0] == '"':
		return raw.replace('""', '"')[1:-1]
	else:
		return raw

def _fail(msg):

	print("exiting, {}".format(msg), file=sys.stderr)

	exit(0)

def get_type_of_all(arr):

	# if all elements can be coerced to int then `int` else `str`

	final_type = int

	for el in arr:
		try:
			int(el)
		except ValueError:
			final_type = str

	return final_type

if len(sys.argv) > 1 and sys.argv[1] != '':
	
	with open(sys.argv[1], 'r') as f:

		entities_meta = [json.loads(line.strip()) for line in f]

# print(sys.argv[2], file=sys.stderr)
# resample_rate = float(sys.argv[2]) if len(sys.argv) > 2 else 1.0
resample_rate = 1.0

for line in sys.stdin:

	entitylist_ints.append(
		{
			"entitylist_int": int(line.strip().split('\t')[0]),
			"ct": int(line.strip().split('\t')[2]) * resample_rate
		}
	)

	raw_aud_ids = line.strip().split('\t')[1]
	aud_ids_unescaped = unescape_daiquery_json(raw_aud_ids)
	aud_ids = json.loads(aud_ids_unescaped)
	
	for aud_id in aud_ids:
		all_ids.add(aud_id)

all_ids = list(all_ids)
ids_type = get_type_of_all(all_ids)
final_all_ids = sorted([ids_type(el) for el in all_ids])

if entities_meta == None:

	entities_meta = [
		{
			"entity_num": ix + 1,
			"id": el,
			"name": str(el)

		}
		for ix, el in enumerate(final_all_ids)
	]

print(json.dumps({"entitylist_ints": entitylist_ints, "entities": entities_meta}))

