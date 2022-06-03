#!/usr/bin/python

# src: sklearn/tests/test_pipeline.py 

def word_ngrams(tokens, ngram_range=(1, 3),stop_words=None):
    """Turn tokens into a sequence of n-grams after stop words filtering"""
    # handle stop words
    if stop_words is not None:
        tokens = [w for w in tokens if w not in stop_words]

    # handle token n-grams
    min_n, max_n = ngram_range
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
        null_join = "".join

        for n in range(min_n, min(max_n + 1, n_original_tokens + 1)):
            for i in range(n_original_tokens - n + 1):
                tokens_append(
                    # space_join(
                    null_join(
                        original_tokens[i: i + n]
                    )
                )

    return tokens

res = word_ngrams(["cat", "dog", "mouse"])
print(res)
print(len(res))
