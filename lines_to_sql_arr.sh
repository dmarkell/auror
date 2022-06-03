#!/bin/bash

if [[ $1 == 'str' ]]
	then
		qu="'"
	else qu=""
fi

sep=" "

out=""
out="$out"$(echo -n '(')
while read line
do
	out="$out"$(echo -n "$qu""$line""$qu"",""$sep")
done

echo -n $(echo $out | rev | cut -c 2- | rev)
echo ')'