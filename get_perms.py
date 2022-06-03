#!/usr/bin/python

# src: sklearn/tests/test_pipeline.py 

import json
import sys

def perms(tokens, sep):
    """Takes a list of items and returns all combinations"""

    # handle token n-grams
    min_n = 1
    max_n = len(tokens)

    if max_n != 1:
        original_tokens = tokens
        if min_n == 1:
            # no need to do any slicing for unigrams
            # just iterate through the original tokens
            tokens = list(original_tokens)
            min_n += 1
        else:
            tokens = []

        n_original_tokens = len(original_tokens)

        # bind method outside of loop to reduce overhead
        tokens_append = tokens.append
        # space_join = " ".join
        null_join = "{}".format(sep).join

        for n in xrange(min_n, min(max_n + 1, n_original_tokens + 1)):
            for i in xrange(n_original_tokens - n + 1):
                tokens_append(
                    # space_join(
                    null_join(
                        original_tokens[i: i + n]
                    )
                )

    return tokens

# res = perms(["a", "b", "c", "d"])
sep = '|'
res = perms([el.strip() for el in sys.stdin], sep)

print(json.dump(perms(res)), sep)
