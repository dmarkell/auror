from __future__ import print_function

import csv
import sys

sys.stdin.reconfigure(encoding='ISO-8859-1')

sep='\t'

for line in csv.reader(sys.stdin):

    print(*[el.replace(sep, ' ').replace('\n', ' ') for el in line], sep=sep)